import {
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { getDocClient } from "./dynamodb.js";

const TABLE =
  process.env.CODING_MODEL_RANKINGS_TABLE || "CodingModelRankings";

const META_PK = "META";
const SK_LATEST_PUBLISHED = "LATEST_PUBLISHED";
const SK_LATEST_DRAFT = "LATEST_DRAFT";

function batchPk(batchId) {
  return `BATCH#${batchId}`;
}

function rankSk(rank) {
  return `RANK#${String(rank).padStart(2, "0")}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function deleteAllBatchItems(batchId) {
  const pk = batchPk(batchId);
  let startKey;
  do {
    const q = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        ExclusiveStartKey: startKey,
      }),
    );
    const keys = (q.Items || []).map((it) => ({ pk: it.pk, sk: it.sk }));
    if (keys.length === 0) break;
    const deleteRequests = keys.map((key) => ({
      DeleteRequest: { Key: key },
    }));
    for (let i = 0; i < deleteRequests.length; i += 25) {
      const chunk = deleteRequests.slice(i, i + 25);
      await getDocClient().send(
        new BatchWriteCommand({
          RequestItems: { [TABLE]: chunk },
        }),
      );
    }
    startKey = q.LastEvaluatedKey;
  } while (startKey);
}

function stripKeys(item) {
  if (!item) return null;
  const {
    pk: _pk,
    sk: _sk,
    ...rest
  } = item;
  return rest;
}

/**
 * @param {import("@aws-sdk/lib-dynamodb").QueryCommandOutput['Items']} items
 */
function sortByRank(items) {
  return [...(items || [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

/**
 * @returns {Promise<{ batchId: string, updatedAt: string, models: object[] } | null>}
 */
export async function getLatestPublishedRanking() {
  const meta = await getDocClient().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: META_PK, sk: SK_LATEST_PUBLISHED },
    }),
  );
  const batchId = meta.Item?.batchId;
  if (!batchId) return null;

  const q = await getDocClient().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": batchPk(batchId) },
    }),
  );
  const models = sortByRank(q.Items || [])
    .filter((it) => it.status === "PUBLISHED")
    .map(stripKeys);

  if (models.length === 0) return null;

  return {
    batchId,
    updatedAt: meta.Item?.updatedAt || models[0]?.updatedAt || nowIso(),
    models,
  };
}

/**
 * @returns {Promise<{ batchId: string, updatedAt: string, models: object[] } | null>}
 */
export async function getLatestDraftRanking() {
  const meta = await getDocClient().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: META_PK, sk: SK_LATEST_DRAFT },
    }),
  );
  const batchId = meta.Item?.batchId;
  if (!batchId) return null;

  const q = await getDocClient().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": batchPk(batchId) },
    }),
  );
  const models = sortByRank(q.Items || [])
    .filter((it) => it.status === "DRAFT")
    .map(stripKeys);

  if (models.length === 0) return null;

  return {
    batchId,
    updatedAt: meta.Item?.updatedAt || models[0]?.updatedAt || nowIso(),
    models,
  };
}

/**
 * @param {object[]} models — exactly 10 ranking rows (rank 1–10)
 * @returns {Promise<{ batchId: string }>}
 */
export async function saveDraftRanking(models) {
  const batchId = randomUUID();
  const ts = nowIso();

  const draftMeta = await getDocClient().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: META_PK, sk: SK_LATEST_DRAFT },
    }),
  );
  const publishedMeta = await getDocClient().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: META_PK, sk: SK_LATEST_PUBLISHED },
    }),
  );
  const oldDraftId = draftMeta.Item?.batchId;
  const publishedId = publishedMeta.Item?.batchId;
  if (oldDraftId && oldDraftId !== publishedId) {
    await deleteAllBatchItems(oldDraftId);
  }

  const pk = batchPk(batchId);
  const putRequests = models.map((m) => ({
    PutRequest: {
      Item: {
        pk,
        sk: rankSk(m.rank),
        batchId,
        rank: m.rank,
        modelName: m.modelName,
        provider: m.provider,
        codingScore: m.codingScore,
        bestFor: m.bestFor,
        speed: m.speed,
        strengths: m.strengths,
        weaknesses: m.weaknesses,
        cursorUsage: m.cursorUsage,
        pricingSummary: m.pricingSummary,
        sourceUrls: m.sourceUrls,
        status: "DRAFT",
        updatedAt: ts,
      },
    },
  }));

  await getDocClient().send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE]: putRequests,
      },
    }),
  );

  await getDocClient().send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: META_PK,
        sk: SK_LATEST_DRAFT,
        batchId,
        updatedAt: ts,
      },
    }),
  );

  return { batchId };
}

/**
 * @param {string} batchId
 * @returns {Promise<{ batchId: string, publishedAt: string }>}
 */
export async function publishDraftRanking(batchId) {
  const pk = batchPk(batchId);
  const q = await getDocClient().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": pk },
    }),
  );
  const items = sortByRank(q.Items || []);
  if (items.length === 0) {
    throw new Error(`No ranking items found for batch ${batchId}`);
  }
  const nonDraft = items.filter((it) => it.status !== "DRAFT");
  if (nonDraft.length > 0) {
    throw new Error("Batch is not a draft or is already published");
  }
  if (items.length < 3) {
    throw new Error("Draft must contain at least 3 models before publish");
  }

  const publishedMeta = await getDocClient().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: META_PK, sk: SK_LATEST_PUBLISHED },
    }),
  );
  const oldPublishedId = publishedMeta.Item?.batchId;

  if (oldPublishedId && oldPublishedId !== batchId) {
    await deleteAllBatchItems(oldPublishedId);
  }

  const ts = nowIso();
  const putPublished = items.map((it) => ({
    PutRequest: {
      Item: {
        ...it,
        status: "PUBLISHED",
        updatedAt: ts,
      },
    },
  }));

  await getDocClient().send(
    new BatchWriteCommand({
      RequestItems: { [TABLE]: putPublished },
    }),
  );

  await getDocClient().send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: META_PK,
        sk: SK_LATEST_PUBLISHED,
        batchId,
        updatedAt: ts,
      },
    }),
  );

  return { batchId, publishedAt: ts };
}

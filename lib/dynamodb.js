import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

function dynamoRegion() {
  return (
    process.env.DYNAMODB_REGION ||
    process.env.AWS_REGION ||
    "us-east-1"
  );
}

/** Static keys for hosts that forbid `AWS_*` env names (e.g. Amplify). */
function dynamoCredentials() {
  const accessKeyId = process.env.DYNAMODB_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DYNAMODB_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }
  const out = { accessKeyId, secretAccessKey };
  if (process.env.DYNAMODB_SESSION_TOKEN) {
    out.sessionToken = process.env.DYNAMODB_SESSION_TOKEN;
  }
  return out;
}

let docClientSingleton = null;

/** Lazy init so `process.env` and Lambda/SSR IAM credentials exist at request time, not only at bundle load. */
export function getDocClient() {
  if (!docClientSingleton) {
    const region = dynamoRegion();
    const explicit = dynamoCredentials();
    const client = new DynamoDBClient({
      region,
      credentials:
        explicit ?? defaultProvider({ clientConfig: { region } }),
    });
    docClientSingleton = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return docClientSingleton;
}

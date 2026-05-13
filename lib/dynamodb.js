import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

function dynamoRegion() {
  return (
    process.env.DYNAMODB_REGION ||
    process.env.AWS_REGION ||
    "us-east-1"
  );
}

/** Explicit creds for hosts that forbid `AWS_*` env keys (e.g. Amplify). Otherwise SDK uses default chain (`AWS_*`, IAM role, etc.). */
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

const credentials = dynamoCredentials();
const client = new DynamoDBClient({
  region: dynamoRegion(),
  ...(credentials ? { credentials } : {}),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

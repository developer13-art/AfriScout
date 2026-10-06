import { env } from "../config/env";

function actionApiRoot() {
  return env.apiUrl.replace(/\/api\/v\d+\/?$/, "");
}

export const opportunityActionService = {
  actionUrl: (opportunityId: string) =>
    `${actionApiRoot()}/actions/v1/opportunities/${opportunityId}`,
};

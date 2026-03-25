import { API_URL } from "@/config/api";

export type SubscriptionPlanType = "clarity" | "insight";

export type SubscriptionActivationResult =
  | {
      status: "activated";
      plan: SubscriptionPlanType;
      alreadyActivated: boolean;
    }
  | {
      status: "pending";
    }
  | {
      status: "auth_required";
    }
  | {
      status: "error";
      message: string;
    };

type CheckAndActivateResponse = {
  activated?: boolean;
  already_activated?: boolean;
  detail?: string;
  found?: boolean;
  plan?: string;
};

type SubscriptionActivationArgs = {
  getToken: (options: { template: string }) => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn?: boolean;
  refresh: () => Promise<unknown> | unknown;
};

type RetryOptions = {
  attempts?: number;
  delayMs?: number;
};

export const SUBSCRIPTION_RETRY_ATTEMPTS = 10;
export const SUBSCRIPTION_RETRY_DELAY_MS = 1500;

const normalizePlan = (plan?: string): SubscriptionPlanType =>
  plan === "insight" ? "insight" : "clarity";

const isActivatedResponse = (result: CheckAndActivateResponse) =>
  Boolean(
    (result.found && (result.activated || result.already_activated)) ||
      result.already_activated
  );

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const readJson = async (
  response: Response
): Promise<CheckAndActivateResponse> => {
  try {
    return (await response.json()) as CheckAndActivateResponse;
  } catch {
    return {};
  }
};

const getBackendToken = async ({
  getToken,
  isLoaded,
  isSignedIn,
}: SubscriptionActivationArgs) => {
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return getToken({ template: "backend-api" });
};

const fetchCheckAndActivate = async (token: string) => {
  const response = await fetch(`${API_URL}/api/v1/billing/check-and-activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = await readJson(response);
  console.log("RAW RESPONSE:", JSON.stringify(result)); // add this
  return { response, result };
};

const buildActivatedResult = async (
  result: CheckAndActivateResponse,
  refresh: SubscriptionActivationArgs["refresh"]
): Promise<SubscriptionActivationResult> => {
  await refresh();

  return {
    status: "activated",
    plan: normalizePlan(result.plan),
    alreadyActivated: Boolean(result.already_activated),
  };
};

export async function checkSubscriptionOnce(
  args: SubscriptionActivationArgs
): Promise<SubscriptionActivationResult> {
  const token = await getBackendToken(args);
  if (!token) {
    return { status: "auth_required" };
  }

  try {
    const { response, result } = await fetchCheckAndActivate(token);

    if (!response.ok) {
      return {
        status: "error",
        message:
          typeof result.detail === "string"
            ? result.detail
            : "Failed to check subscription",
      };
    }

    if (isActivatedResponse(result)) {
      return buildActivatedResult(result, args.refresh);
    }

    return { status: "pending" };
  } catch (error: any) {
    return {
      status: "error",
      message: error?.message || "Failed to check subscription",
    };
  }
}

export async function checkSubscriptionWithRetry(
  args: SubscriptionActivationArgs,
  options: RetryOptions = {}
): Promise<SubscriptionActivationResult> {
  console.log("checkSubscriptionWithRetry called", {
    isLoaded: args.isLoaded,
    isSignedIn: args.isSignedIn,
  });
  const token = await getBackendToken(args);
  console.log("token:", token ? "got token" : "NULL - returning auth_required");
  if (!token) {
    return { status: "auth_required" };
  }

  const attempts = options.attempts ?? SUBSCRIPTION_RETRY_ATTEMPTS;
  const delayMs = options.delayMs ?? SUBSCRIPTION_RETRY_DELAY_MS;
  let sawPendingState = false;
  let lastErrorMessage: string | null = null;
  try {
  const { response, result } = await fetchCheckAndActivate(token);
  if (response.ok && isActivatedResponse(result)) {
    return buildActivatedResult(result, args.refresh);
  }
} catch {}

  for (let attempt = 0; attempt < attempts; attempt += 1) {
  try {
    const { response, result } = await fetchCheckAndActivate(token);

    if (response.ok && isActivatedResponse(result)) {
      return buildActivatedResult(result, args.refresh);
    }

    if (response.status === 401) {
      return {
        status: "error",
        message: typeof result.detail === "string"
          ? result.detail
          : "Unauthorized request while checking subscription",
      };
    }

    if (response.ok) {
      sawPendingState = true; // webhook not fired yet, keep retrying
    } else {
      lastErrorMessage = typeof result.detail === "string"
        ? result.detail
        : `Failed to check subscription (${response.status})`;
    }
  } catch (error) {
    console.log("Retry error:", error);
    lastErrorMessage = error instanceof Error
      ? error.message
      : "Failed to check subscription";
  }

  if (attempt < attempts - 1) {
    await wait(delayMs);
  }
}

  if (sawPendingState) {
    return { status: "pending" };
  }

  return {
    status: "error",
    message: lastErrorMessage || "Failed to check subscription",
  };
}

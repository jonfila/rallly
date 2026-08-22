import { beforeEach, describe, expect, it, vi } from "vitest";
import { fillSpaceProfile } from "./mutations";

const { mockUpdateMany } = vi.hoisted(() => ({
  mockUpdateMany: vi.fn(),
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    space: {
      updateMany: mockUpdateMany,
    },
  },
}));

// mutations.ts reaches storage at import time, which pulls in the validated
// env. Not on fillSpaceProfile's path.
vi.mock("@/lib/storage/asset-upload", () => ({
  deleteStoredAsset: vi.fn(),
  replaceStoredAsset: vi.fn(),
}));

const SPACE_ID = "space_1";

function callsFor(field: "spaceType" | "industry") {
  return mockUpdateMany.mock.calls
    .map(([args]) => args)
    .filter((args) => field in args.data);
}

describe("fillSpaceProfile", () => {
  beforeEach(() => {
    mockUpdateMany.mockReset();
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("guards each field on being unanswered", async () => {
    await fillSpaceProfile({
      spaceId: SPACE_ID,
      spaceType: "work",
      industry: "healthcare",
    });

    // The null check has to be in the where clause, not a read-then-write:
    // it is what stops setup overwriting an answer the user already gave.
    expect(callsFor("spaceType")[0].where).toEqual({
      id: SPACE_ID,
      spaceType: null,
    });
    expect(callsFor("industry")[0].where).toEqual({
      id: SPACE_ID,
      industry: null,
    });
  });

  it("guards the two fields independently", async () => {
    // A space can carry a type from an earlier setup while its industry has
    // never been answered, so neither guard may depend on the other.
    await fillSpaceProfile({
      spaceId: SPACE_ID,
      spaceType: "work",
      industry: "healthcare",
    });

    for (const args of mockUpdateMany.mock.calls.map(([a]) => a)) {
      expect(Object.keys(args.data)).toHaveLength(1);
    }
  });

  it("writes nothing when there is no answer to store", async () => {
    await fillSpaceProfile({ spaceId: SPACE_ID });
    expect(mockUpdateMany).not.toHaveBeenCalled();

    await fillSpaceProfile({ spaceId: SPACE_ID, industry: null });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("skips the field it was given nothing for", async () => {
    await fillSpaceProfile({ spaceId: SPACE_ID, industry: "healthcare" });

    expect(callsFor("spaceType")).toHaveLength(0);
    expect(callsFor("industry")).toHaveLength(1);
  });

  it("reports which fields it actually filled", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    await expect(
      fillSpaceProfile({
        spaceId: SPACE_ID,
        spaceType: "work",
        industry: "healthcare",
      }),
    ).resolves.toEqual({ filledSpaceType: true, filledIndustry: true });

    // count 0 means the row already held an answer, so nothing changed and
    // the caller must not report it as newly set.
    mockUpdateMany.mockResolvedValue({ count: 0 });
    await expect(
      fillSpaceProfile({
        spaceId: SPACE_ID,
        spaceType: "work",
        industry: "healthcare",
      }),
    ).resolves.toEqual({ filledSpaceType: false, filledIndustry: false });
  });

  it("reports nothing filled for a field it never wrote", async () => {
    await expect(
      fillSpaceProfile({ spaceId: SPACE_ID, industry: "healthcare" }),
    ).resolves.toEqual({ filledSpaceType: false, filledIndustry: true });
  });
});

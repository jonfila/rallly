import "server-only";

import type { SpaceTier, SpaceType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { after } from "next/server";
import { createSpaceDTO } from "@/features/space/data";
import { isSelfHosted } from "@/lib/constants";
import {
  deleteStoredAsset,
  replaceStoredAsset,
} from "@/lib/storage/asset-upload";

export async function createSpace({
  name = "Personal",
  ownerId,
  tier = isSelfHosted ? "pro" : "hobby",
  spaceType,
  industry,
}: {
  name?: string;
  ownerId: string;
  tier?: SpaceTier;
  spaceType?: SpaceType;
  industry?: string | null;
}) {
  const space = await prisma.space.create({
    data: {
      name,
      ownerId,
      tier,
      spaceType,
      industry,
      members: {
        create: {
          userId: ownerId,
          role: "ADMIN",
          lastSelectedAt: new Date(),
        },
      },
    },
  });

  return createSpaceDTO({
    ...space,
    role: "ADMIN",
    memberCount: 1,
    seatCount: 1,
  });
}

export async function updateSpace({
  spaceId,
  name,
  primaryColor,
}: {
  spaceId: string;
  name?: string;
  primaryColor?: string | null;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: {
      ...(name !== undefined && { name }),
      ...(primaryColor !== undefined && { primaryColor }),
    },
  });
}

/**
 * Fill in profile answers the space has never held, leaving any stored answer
 * untouched. Setup uses this when the account already owns a space: the form
 * still asked for a type and an industry, so the answers have to land
 * somewhere, but setup must not overwrite what is already there — the same
 * rule that stops it renaming an existing space.
 *
 * The null check sits in the where clause rather than in a read-then-write, so
 * two concurrent submits can't both see a blank and race. Returns which fields
 * were actually filled, so the caller only reports what it really changed.
 */
export async function fillSpaceProfile({
  spaceId,
  spaceType,
  industry,
}: {
  spaceId: string;
  spaceType?: SpaceType;
  industry?: string | null;
}) {
  // Each field is guarded independently: a space can carry a type from an
  // earlier setup while its industry has never been answered.
  const [spaceTypeResult, industryResult] = await Promise.all([
    spaceType
      ? prisma.space.updateMany({
          where: { id: spaceId, spaceType: null },
          data: { spaceType },
        })
      : undefined,
    industry
      ? prisma.space.updateMany({
          where: { id: spaceId, industry: null },
          data: { industry },
        })
      : undefined,
  ]);

  return {
    filledSpaceType: (spaceTypeResult?.count ?? 0) > 0,
    filledIndustry: (industryResult?.count ?? 0) > 0,
  };
}

export async function updateSpaceShowBranding({
  spaceId,
  showBranding,
}: {
  spaceId: string;
  showBranding: boolean;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: { showBranding },
  });
}

export async function updateSpaceHideAttribution({
  spaceId,
  hideAttribution,
}: {
  spaceId: string;
  hideAttribution: boolean;
}) {
  await prisma.space.update({
    where: { id: spaceId },
    data: { hideAttribution },
  });
}

export async function updateSpaceImage({
  spaceId,
  imageKey,
}: {
  spaceId: string;
  imageKey: string | null;
}) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { image: true },
  });

  await replaceStoredAsset({
    currentKey: space?.image,
    nextKey: imageKey,
    persist: async () => {
      await prisma.space.update({
        where: { id: spaceId },
        data: { image: imageKey },
      });
    },
  });
}

export async function deleteSpace({ spaceId }: { spaceId: string }) {
  const deletedSpace = await prisma.space.delete({
    where: { id: spaceId },
  });

  const imageKey = deletedSpace.image;

  if (imageKey) {
    after(() => deleteStoredAsset(imageKey));
  }
}

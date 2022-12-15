import { Recipe } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "../../src/server/router";
import { createContextInner } from "../../src/server/router/context";

describe("recipe@getByID", async () => {
  const ctx = await createContextInner({ session: null });
  const caller = appRouter.createCaller(ctx);

  it("should return 404 NOT FOUND if the recipe does not exist", async () => {
    await expect(async () => {
      await caller.query("recipe.getByID", { id: "dsajkjdskal" });
    }).rejects.toThrow(
      new TRPCError({ code: "NOT_FOUND", message: "Recipe not found." })
    );
  });

  const firstRecipe = await ctx.prisma.recipe.findFirstOrThrow();

  const recipe = await caller.query("recipe.getByID", {
    id: firstRecipe.id,
  });

  it("should get a recipe when the id exists", () => {
    expect(recipe).toMatchObject<Recipe>({
      id: expect.any(String),
      name: expect.any(String),
      displayImage: expect.any(String),
      ingredients: expect.any(String),
      method: expect.any(String),
      tags: expect.any(Array<string>),
      userId: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});

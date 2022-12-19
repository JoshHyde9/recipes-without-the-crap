import { Recipe } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { EditRecipeSchema } from "../../src/server/common/schemas";
import {
  loggedInCaller,
  loggedInCtx,
  loggedOutCaller,
  loggedOutCtx,
} from "../data";

describe("recipe@delete", async () => {
  const recipe = await loggedOutCtx.prisma.recipe.findFirstOrThrow();

  it("should return 401 UNAUTHORIZED if a user tries to delete an existing recipe and is not logged in", async () => {
    await expect(async () => {
      await loggedOutCaller.mutation("recipe.delete", { id: recipe.id });
    }).rejects.toThrow(
      new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorised." })
    );
  });

  it("should return 400 BAD REQUEST when the recipe does not exist", async () => {
    await expect(async () => {
      await loggedInCaller.mutation("recipe.delete", {
        id: `${recipe.id}d`,
      });
    }).rejects.toThrow(
      new TRPCError({ code: "BAD_REQUEST", message: "Recipe does not exist." })
    );
  });

  it("should return 403 FORBIDDEN when the logged in user tries to edit another user's recipe", async () => {
    await expect(async () => {
      await loggedInCaller.mutation("recipe.delete", { id: recipe.id });
    }).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "You are not allowed to delete other people's recipes.",
      })
    );
  });

  it("should successfully edit an existing recipe that the logged in user created", async () => {
    const editedRecipeData: EditRecipeSchema = {
      id: "c4a1a236-9547-4659-aa95-3b761fb62d0b",
      name: "Croissant",
      displayImage:
        "https://static01.nyt.com/images/2021/04/07/dining/06croissantsrex1/merlin_184841898_ccc8fb62-ee41-44e8-9ddf-b95b198b88db-master768.jpg",
      ingredients: "1. A lot of butter",
      method: "1. Make the damn croissants",
      tags: "Epic,Food,Pastry",
    };

    const editedRecipe = await loggedInCaller.mutation("recipe.edit", {
      ...editedRecipeData,
    });

    expect(editedRecipe).toMatchObject<Recipe>({
      ...editedRecipeData,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: loggedInCtx.session!.user.id,
      tags: ["Epic", "Food", "Pastry"],
      createdAt: editedRecipe.createdAt,
      updatedAt: editedRecipe.updatedAt,
    });
  });
});

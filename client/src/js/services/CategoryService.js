import { StorageManager } from "../utils/StorageManager.js";
import { Validator } from "../utils/Validator.js";
import { ActivityLogService } from "../services/ActivityLogService.js";

export class CategoryService {
  /************** getAll methoud***********/
  async getAll() {
    return await StorageManager.getAll("categories");
  }

  /**************add category methoud***********/
  async add(categoryName) {
    //getAll categories
    const categories = await this.getAll();

    //check category is empty or not
    if (!categoryName || !categoryName.trim()) {
      throw new Error("Category name is empty");
    }

    //check unique category
    const duplicateCategory = categories.find(
      (c) => c.name.toUpperCase() === categoryName.toUpperCase(),
    );
    if (duplicateCategory) {
      throw new Error("Duplicate Category");
    }

    //create category object
    const newCategory = {
      id: crypto.randomUUID(),
      name: categoryName.trim(),
    };

    //add to storage
    await StorageManager.create("categories", newCategory);

    //save the activity
    await ActivityLogService.log(`Added category: ${categoryName}`);
  }

  /**************delete category methoud***********/
  async delete(categoryName) {
    const categories = await this.getAll();
    const categoryObj = categories.find(
      (c) => c.name.toUpperCase() === categoryName.toUpperCase(),
    );

    if (!categoryObj) throw new Error("Category not found");

    //check if this category is in use or not
    const products = await StorageManager.getWhere("products", {
      category: categoryObj.name,
    });

    if (products.length > 0)
      throw new Error(
        `Cannot delete "${categoryName}" it is used by existing products`,
      );

    //delete category
    await StorageManager.delete("categories", categoryObj.id);

    //save the activity
    await ActivityLogService.log(`Deleted category: ${categoryName}`);
  }

  /**************edit category methoud***********/
  async edit(oldName, newName) {
    const categories = await this.getAll();
    const categoryObj = categories.find(
      (c) => c.name.toUpperCase() === oldName.toUpperCase(),
    );

    if (!categoryObj) throw new Error("Category not found");

    //check if the update category name exist
    const duplicate = categories.find(
      (c) => c.name.toUpperCase() === newName.toUpperCase(),
    );
    if (duplicate) throw new Error("Category already exists");

    //patch category name
    await StorageManager.patch("categories", categoryObj.id, { name: newName });

    //save the activity
    await ActivityLogService.log(
      `Edited category from ${oldName} to ${newName}`,
    );

    /***********************Update products that have old category name ******************** */
    const productsToUpdate = await StorageManager.getWhere("products", {
      category: categoryObj.name,
    });

    const updates = productsToUpdate.map((p) =>
      StorageManager.patch("products", p.id, { category: newName }),
    );
    await Promise.all(updates);

    //save the activity
    if (productsToUpdate.length > 0) {
      await ActivityLogService.log(
        `Updated products category name from ${oldName} to ${newName}`,
      );
    }
  }
}

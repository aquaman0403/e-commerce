'use strict'

const { product, clothing, electronic, furniture } = require("../models/product.model");
const { BadRequestError } = require("../core/error.response");
const { 
    findAllDraftsForShop, 
    publishProductByShop, 
    findAllPublishesForShop,
    unPublishProductByShop,
    searchProductByUser
} = require("../models/repositories/product.repo");

// define the factory class to create product
class ProductFactory {
    static productRegistry = {} // key-class

    static registerProductType(type, classRef) {
        ProductFactory.productRegistry[type] = classRef;
    }

    static async createProduct(type, payload) {
        const productClass = ProductFactory.productRegistry[type];
        if (!productClass) {
            throw new BadRequestError('Invalid product type');
        }
        return new productClass(payload).createProduct();
    }

    /* PUT */
    static async publishProductByShop({ product_shop, product_id }) {
        return await publishProductByShop({product_shop, product_id });
    }

    static async unPublishProductByShop({ product_shop, product_id }) {
        return await unPublishProductByShop({product_shop, product_id });
    }

    /* END PUT */

    /* QUERY */
    static async findAllDraftsForShop({product_shop, limit = 50, skip = 0}) {
        const query = { product_shop, isDraft: true };
        return await findAllDraftsForShop({query, limit, skip});
    }

    static async findAllPublishesForShop({product_shop, limit = 50, skip = 0}) {
        const query = { product_shop, isPublished: true };
        return await findAllPublishesForShop({query, limit, skip});
    }

    static async searchProducts({keySearch}) {
        return await searchProductByUser({keySearch});
    }
    /* END QUERY */
}

class Product {
    constructor({
        product_name, product_thumb, product_description, product_price,
        product_quantity, product_type, product_shop, product_attributes
    }) {
        this.product_name = product_name;
        this.product_thumb = product_thumb;
        this.product_description = product_description;
        this.product_price = product_price;
        this.product_quantity = product_quantity;
        this.product_type = product_type;
        this.product_shop = product_shop;
        this.product_attributes = product_attributes;
    }
    // Create new product
    async createProduct( product_id ) {
        return await product.create({...this, _id: product_id})
    }
}

// Define sub-class for different product types Clothing
class Clothing extends Product {

    async createProduct() {
        const newClothing = await clothing.create(this.product_attributes);
        if (!newClothing) {
            throw new BadRequestError('Create new clothing failed');
        }
        const newProduct = await super.createProduct();
        if (!newProduct) {
            throw new BadRequestError('Create new product failed');
        }

        return newProduct;
    }
}


// Define sub-class for different product types Electronic
class Electronic extends Product {

    async createProduct() {
        const newElectronic = await electronic.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        });
        if (!newElectronic) {
            throw new BadRequestError('Create new electronic failed');
        }
        const newProduct = await super.createProduct(newElectronic._id);
        if (!newProduct) {
            throw new BadRequestError('Create new product failed');
        }

        return newProduct;
    }
}

// Define sub-class for different product types Furniture
class Furniture extends Product {

    async createProduct() {
        const newFurniture = await furniture.create({
            ...this.product_attributes,
            product_shop: this.product_shop
        });
        if (!newFurniture) {
            throw new BadRequestError('Create new electronic failed');
        }
        const newProduct = await super.createProduct(newFurniture._id);
        if (!newProduct) {
            throw new BadRequestError('Create new product failed');
        }

        return newProduct;
    }
}

// Register product types
ProductFactory.registerProductType('Clothing', Clothing);
ProductFactory.registerProductType('Electronics', Electronic);
ProductFactory.registerProductType('Furniture', Furniture);

module.exports = ProductFactory;
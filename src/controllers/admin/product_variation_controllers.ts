import { NextFunction, Response } from "express";
import { TypedRequestBody } from "../../types/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { ProductVariation } from "../../models/productVariation.model.js";
import { ProductVariationOption } from "../../models/productVariationOption.js";
import { ProductVariationConfiguration } from "../../models/productVariationConfiguration.model.js";
import { ObjectId } from "mongodb";
import { Schema } from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ProductSKU } from "../../models/productSKU.model.js";

type CreateProductVariationRequest = {
    M08_name: string;
    M08_M05_product_id: string;
    M08_is_active: number;
    options: {
        M09_name: string;
        M09_is_active: number;
    }[];
}

export const createProductVariationController = async (req: TypedRequestBody<CreateProductVariationRequest>, res: Response, next: NextFunction) => {

    try {
        const { M08_name, M08_M05_product_id, M08_is_active, options } = req.body;

        
        if (options.length < 1) {
            return res.status(400).json(new ApiError(400, 'Variation options is required', 'Variation options is required'));
        }

        const variationNames = options.map(option => option.M09_name);
        const duplicateVariationNames = variationNames.filter((item, index) => variationNames.indexOf(item) != index);

        if (duplicateVariationNames.length > 0) {
            return res.status(400).json(new ApiError(400, 'Variation options must be unique', 'Variation options must be unique'));
        }

        const existingVariation = await ProductVariation.findOne({ M08_name, M08_M05_product_id,M08_deleted_at:null });

        if (existingVariation) {
            return res.status(400).json(new ApiError(400, 'Variation already exists', 'Variation already exists'));
        }

        const skuFoundUnderProduct = await ProductSKU.findOne({ M06_M05_product_id: new ObjectId(M08_M05_product_id),M10_deleted_at:null });

        if (skuFoundUnderProduct) {
            return res.status(400).json(new ApiError(400, 'There is already sku under this variation. delete that first', 'There is already sku under this variation. delete that first'));
        }

        const variation = new ProductVariation({ M08_name, M08_M05_product_id, M08_is_active });

        await variation.save();

        const variationOptions = options.map(option => ({
            M09_name: option.M09_name,
            M09_is_active: option.M09_is_active,
            M09_M08_product_variation_id: variation._id,
            M09_M05_product_id: M08_M05_product_id
        }));

        await  ProductVariationOption.insertMany(variationOptions);

        return res.status(201).json(new ApiResponse(true,201, 'Variation created successfully', 'Variation created successfully'));

    } catch (error) {
        next(error);
    }
}


export const updateProductVariationController = async (req: TypedRequestBody<{ 
    M08_name: string, 
    M08_M05_product_id: string, 
    M08_is_active: number 
}>, res: Response, next: NextFunction) => {
    try {
        const { M08_name, M08_M05_product_id, M08_is_active } = req.body;
        const id = req.params.id;

        

        const existingVariation = await ProductVariation.findOne({ M08_name, M08_M05_product_id,M08_deleted_at:null, _id: { $ne: id } });

        if (existingVariation) {
            return res.status(400).json(new ApiError(400, 'Variation already available', 'Variation already available'));
        }

        const variation = await ProductVariation.findByIdAndUpdate(id, { M08_name, M08_M05_product_id, M08_is_active }, { new: true });

        if (!variation) {
            return res.status(404).json(new ApiError(404, 'Variation not found', 'Variation not found'));
        }

        return res.status(200).json(new ApiResponse(true,200, 'Variation updated successfully', null));

    } catch (error) {
        next(error);
    }
}

export const deleteProductVariationController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const configuration = await ProductVariationConfiguration.findOne({ M10_M08_product_variation_id: id, M10_deleted_at: null });

        if (configuration) {
            return res.status(400).json(new ApiError(400, 'SKU found under this variation. Can not delete this variation', 'SKU found under this variation. Can not delete this variation'));
        }

        await ProductVariation.findByIdAndUpdate(id, { M08_deleted_at: new Date() }, { new: true });

        await ProductVariationOption.updateMany({ M09_M08_product_variation_id: id }, { M09_deleted_at: new Date() });

        return res.status(200).json(new ApiResponse(true,200, 'successfully deleted product variation', 'successfully deleted product variation'));

    } catch (error) {
        next(error);
    }
}


export const createProductVariationOptionController = async (req: TypedRequestBody<{ M09_name: string, M09_is_active: number, M09_M08_product_variation_id: string }>, res: Response, next: NextFunction) => {
    try {
        const { M09_name, M09_is_active, M09_M08_product_variation_id } = req.body;


        const existingVariationOption = await ProductVariationOption.findOne({ M09_name, M09_M08_product_variation_id,M09_deleted_at:null });

        if (existingVariationOption) {
            return res.status(400).json(new ApiError(400, 'This variation option is already available', 'This variation option is already available'));
        }

        const variation = await ProductVariation.findById(M09_M08_product_variation_id);

        if (!variation) {
            return res.status(404).json(new ApiError(404, 'Variation not found', 'Variation not found'));
        }

        const variationOption = new ProductVariationOption({ M09_name, M09_is_active, M09_M08_product_variation_id, M09_M05_product_id: variation.M08_M05_product_id });

        await variationOption.save();

        return res.status(201).json(new ApiResponse(true,201, 'successfully created product variation option', 'successfully created product variation option'));

    } catch (error) {
        next(error);
    }
}


export const updateProductVariationOptionController = async (req: TypedRequestBody<{ M09_name: string, M09_is_active: number, M09_M08_product_variation_id: string }>, res: Response, next: NextFunction) => {
    try {
        const { M09_name, M09_is_active, M09_M08_product_variation_id } = req.body;
        const id = req.params.id;

        const variationOption = await ProductVariationOption.findById(id);

        if (!variationOption) {
            return res.status(404).json(new ApiError(404, 'Variation option not found', 'Variation option not found'));
        }


        const existingVariationOption = await ProductVariationOption.findOne({ M09_name, M09_M08_product_variation_id,M09_deleted_at:null, _id: { $ne: id } });

        if (existingVariationOption) {
            return res.status(400).json(new ApiError(400, 'This variation option is already available', 'This variation option is already available'));
        }

        const variation = await ProductVariation.findById(M09_M08_product_variation_id);

        if (!variation) {
            return res.status(404).json(new ApiError(404, 'Variation not found', 'Variation not found'));
        }

        variationOption.M09_name = M09_name;
        variationOption.M09_is_active = M09_is_active;
        variationOption.M09_M08_product_variation_id = new ObjectId(M09_M08_product_variation_id) as any as Schema.Types.ObjectId;
        variationOption.M09_M05_product_id = variation.M08_M05_product_id
        variationOption.M09_deleted_at  = variation.M08_deleted_at

        await variationOption.save();

        return res.status(200).json(new ApiResponse(true, 200, 'successfully updated product variation option', 'successfully updated product variation option'));

    } catch (error) {
        next(error);
    }
}


export const deleteProductVariationOptionController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const configuration = await ProductVariationConfiguration.findOne({ M10_M09_variation_option_id: id, M10_deleted_at: null });

        if (configuration) {
            return res.status(400).json(new ApiError(400, 'SKU found under this variation. Can not delete this variation', 'SKU found under this variation. Can not delete this variation'));
        }

        const variationOption = await ProductVariationOption.findById(id);
        if(!variationOption){
            return res.status(404).json(new ApiError(404, 'Variation option not found', 'Variation option not found'));
        }

        //check if this is last option under this variation
        const variation = await ProductVariation.findById(variationOption.M09_M08_product_variation_id);
        const isLastOption = (await ProductVariationOption.find({ M09_M08_product_variation_id: variation?._id, M09_deleted_at: null })).length === 1;

        if (isLastOption) {
            await ProductVariation.findByIdAndUpdate(variation?._id, { M08_deleted_at: new Date() }, { new: true });
        }

        await ProductVariationOption.findByIdAndUpdate(id, { M09_deleted_at: new Date() }, { new: true });

        return res.status(200).json(new ApiResponse(true,200, 'successfully deleted product variation', 'successfully deleted product variation'));

    } catch (error) {
        next(error);
    }
}



export const updateVariationConfigurationController = async (req: TypedRequestBody<{configurations:{
    _id: string,
    M10_M06_product_sku_id: string,
    M10_M08_product_variation_id: string,
    M10_M09_variation_option_id: string
}[]}>, res: Response, next: NextFunction) => {

    const { skuId } = req.params;
    const configurations = req.body.configurations;

    try {
        // Step 1: Check if the count of existing configurations matches the requested configurations
        const existingConfigs = await ProductVariationConfiguration.find({ M10_M06_product_sku_id: skuId });

        if (existingConfigs.length !== configurations.length) {
            return res.status(409).json(new ApiError(409, "Some variations conflicts found", "Some variations conflicts found"));
        }

        // Map existing configurations by `_id` for efficient lookup
        const existingConfigsMap = new Map(
            existingConfigs.map(config => [config._id.toString(), config])
        );

        // Gather unique `M10_M08_product_variation_id`s from the requested configurations
        const variationIds = configurations.map(config => config.M10_M08_product_variation_id);

        // Check if the required fields in each configuration match the existing record
        for (const config of configurations) {
            const existingConfig = existingConfigsMap.get(config._id);

            if (
                !existingConfig ||
                existingConfig.M10_M06_product_sku_id.toString() !== config.M10_M06_product_sku_id ||
                existingConfig.M10_M08_product_variation_id.toString() !== config.M10_M08_product_variation_id
            ) {
                return res.status(409).json(new ApiError(409, "Some variations conflicts found", "Some variations conflicts found"));
            }
        }

        // Step 2: Fetch all relevant variations in a single `find` query
        const variations = await ProductVariation.find({
            _id: { $in: variationIds },
        });

        // Map variations by their `_id` for quick access
        const variationMap = new Map(
            variations.map(variation => [variation._id.toString(), variation])
        );

        // Validate configurations in a single iteration
        // Validate `M10_M09_variation_option_id` using the fetched variations map
        for (const config of configurations) {
            const existingConfig = existingConfigsMap.get(config._id);

            

            const variation = variationMap.get(config.M10_M08_product_variation_id.toString());
            if (!variation || !(variation.M08_M05_product_id.toString() === existingConfig!.M10_M05_product_id.toString())) {
                return res.status(409).json(new ApiError(409, "Some variations conflicts found", "Some variations conflicts found"));
            }
        }


        const pipeline = [
            {
                $match: {
                    M10_M05_product_id: new ObjectId(
                        existingConfigs[0].M10_M05_product_id.toString()
                    ),
                    M10_M09_variation_option_id: {
                        $in: configurations.map((config) => new ObjectId(config.M10_M09_variation_option_id))
                    },
                    M10_deleted_at: null
                }
            },
            {
                $group: {
                    _id: "$M10_M06_product_sku_id",
                    variationOptions: {
                        $addToSet: "$M10_M09_variation_option_id"
                    }
                }
            },
            {
                $match: {
                    variationOptions: {
                        $all: configurations.map((config) => new ObjectId(config.M10_M09_variation_option_id))
                    }
                }
            }
        ]

        const existingSkuWithConfig = await ProductVariationConfiguration.aggregate(pipeline);



        if (existingSkuWithConfig.length) {
            throw new Error("SKU with the specified product and variation configuration already exists");
        }


        // Step 3: Update configurations in a single `bulkWrite` operation
        const bulkOperations = configurations.map(config => ({
            updateOne: {
                filter: { _id: config._id },
                update: { M10_M09_variation_option_id: config.M10_M09_variation_option_id },
            },
        }));

        await ProductVariationConfiguration.bulkWrite(bulkOperations);

        return res.status(200).json(new ApiResponse(true, 200, 'successfully updated product variation configuration', 'successfully updated product variation configuration'));

    } catch (error) {
        next(error)
    }

}

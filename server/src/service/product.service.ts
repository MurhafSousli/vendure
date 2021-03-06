import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

import { ID, PaginatedList } from '../../../shared/shared-types';
import { buildListQuery } from '../common/build-list-query';
import { ListQueryOptions } from '../common/common-types';
import { DEFAULT_LANGUAGE_CODE } from '../common/constants';
import { createTranslatable } from '../common/create-translatable';
import { updateTranslatable } from '../common/update-translatable';
import { assertFound } from '../common/utils';
import { ProductOptionGroup } from '../entity/product-option-group/product-option-group.entity';
import { ProductTranslation } from '../entity/product/product-translation.entity';
import { CreateProductDto, UpdateProductDto } from '../entity/product/product.dto';
import { Product } from '../entity/product/product.entity';
import { I18nError } from '../i18n/i18n-error';
import { LanguageCode } from '../locale/language-code';
import { Translated } from '../locale/locale-types';
import { translateDeep } from '../locale/translate-entity';
import { TranslationUpdaterService } from '../locale/translation-updater.service';

@Injectable()
export class ProductService {
    constructor(
        @InjectConnection() private connection: Connection,
        private translationUpdaterService: TranslationUpdaterService,
    ) {}

    findAll(
        lang: LanguageCode,
        options: ListQueryOptions<Product>,
    ): Promise<PaginatedList<Translated<Product>>> {
        const relations = ['variants', 'optionGroups', 'variants.options', 'variants.facetValues'];

        return buildListQuery(this.connection, Product, options, relations)
            .getManyAndCount()
            .then(([products, totalItems]) => {
                const items = products.map(product =>
                    translateDeep(product, lang, [
                        'optionGroups',
                        'variants',
                        ['variants', 'options'],
                        ['variants', 'facetValues'],
                    ]),
                );
                return {
                    items,
                    totalItems,
                };
            });
    }

    findOne(productId: ID, lang: LanguageCode): Promise<Translated<Product> | undefined> {
        const relations = ['variants', 'optionGroups', 'variants.options'];

        return this.connection.manager
            .findOne(Product, productId, { relations })
            .then(
                product =>
                    product &&
                    translateDeep(product, lang, ['optionGroups', 'variants', ['variants', 'options']]),
            );
    }

    async create(createProductDto: CreateProductDto): Promise<Translated<Product>> {
        const save = createTranslatable(Product, ProductTranslation, async p => {
            const { optionGroupCodes } = createProductDto;
            if (optionGroupCodes && optionGroupCodes.length) {
                const optionGroups = await this.connection.getRepository(ProductOptionGroup).find();
                const selectedOptionGroups = optionGroups.filter(og => optionGroupCodes.includes(og.code));
                p.optionGroups = selectedOptionGroups;
            }
        });
        const product = await save(this.connection, createProductDto);
        return assertFound(this.findOne(product.id, DEFAULT_LANGUAGE_CODE));
    }

    async update(updateProductDto: UpdateProductDto): Promise<Translated<Product>> {
        const save = updateTranslatable(Product, ProductTranslation, this.translationUpdaterService);
        const product = await save(this.connection, updateProductDto);
        return assertFound(this.findOne(product.id, DEFAULT_LANGUAGE_CODE));
    }

    async addOptionGroupToProduct(productId: ID, optionGroupId: ID): Promise<Translated<Product>> {
        const product = await this.getProductWithOptionGroups(productId);
        const optionGroup = await this.connection.getRepository(ProductOptionGroup).findOne(optionGroupId);
        if (!optionGroup) {
            throw new I18nError(`error.option-group-with-id-not-found`, { optionGroupId });
        }

        if (Array.isArray(product.optionGroups)) {
            product.optionGroups.push(optionGroup);
        } else {
            product.optionGroups = [optionGroup];
        }

        await this.connection.manager.save(product);
        return assertFound(this.findOne(productId, DEFAULT_LANGUAGE_CODE));
    }

    async removeOptionGroupFromProduct(productId: ID, optionGroupId: ID): Promise<Translated<Product>> {
        const product = await this.getProductWithOptionGroups(productId);
        product.optionGroups = product.optionGroups.filter(g => g.id !== optionGroupId);

        await this.connection.manager.save(product);
        return assertFound(this.findOne(productId, DEFAULT_LANGUAGE_CODE));
    }

    private async getProductWithOptionGroups(productId: ID): Promise<Product> {
        const product = await this.connection
            .getRepository(Product)
            .findOne(productId, { relations: ['optionGroups'] });
        if (!product) {
            throw new I18nError(`error.product-with-id-not-found`, { productId });
        }
        return product;
    }
}

import { ID } from '../../../../shared/shared-types';
import { TranslatedInput } from '../../locale/locale-types';

import { ProductVariant } from './product-variant.entity';

export interface CreateProductVariantDto extends TranslatedInput<ProductVariant> {
    sku: string;
    price: number;
    image?: string;
    optionCodes?: string[];
}

export interface UpdateProductVariantDto extends TranslatedInput<ProductVariant> {
    id: ID;
    sku: string;
    price: number;
    image?: string;
    optionCodes?: string[];
}

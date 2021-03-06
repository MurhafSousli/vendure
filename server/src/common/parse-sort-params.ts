import { Connection, OrderByCondition } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

import { Type } from '../../../shared/shared-types';
import { VendureEntity } from '../entity/base/base.entity';
import { I18nError } from '../i18n/i18n-error';

import { SortParameter } from './common-types';

/**
 * Parses the provided SortParameter array against the metadata of the given entity, ensuring that only
 * valid fields are being sorted against. The output assumes
 * @param connection
 * @param entity
 * @param sortParams
 */
export function parseSortParams<T extends VendureEntity>(
    connection: Connection,
    entity: Type<T>,
    sortParams: SortParameter<T> | undefined,
): OrderByCondition {
    if (!sortParams || Object.keys(sortParams).length === 0) {
        return {};
    }

    const metadata = connection.getMetadata(entity);
    const columns = metadata.columns;
    let translationColumns: ColumnMetadata[] = [];
    const relations = metadata.relations;

    const translationRelation = relations.find(r => r.propertyName === 'translations');
    if (translationRelation) {
        const translationMetadata = connection.getMetadata(translationRelation.type);
        translationColumns = columns.concat(translationMetadata.columns.filter(c => !c.relationMetadata));
    }

    const output = {};
    const alias = metadata.name.toLowerCase();

    for (const [key, order] of Object.entries(sortParams)) {
        if (columns.find(c => c.propertyName === key)) {
            output[`${alias}.${key}`] = order;
        } else if (translationColumns.find(c => c.propertyName === key)) {
            output[`${alias}_translations.${key}`] = order;
        } else {
            throw new I18nError('error.invalid-sort-field', {
                fieldName: key,
                validFields: getValidSortFields([...columns, ...translationColumns]),
            });
        }
    }
    return output;
}

function getValidSortFields(columns: ColumnMetadata[]): string {
    return Array.from(new Set(columns.map(c => c.propertyName))).join(', ');
}

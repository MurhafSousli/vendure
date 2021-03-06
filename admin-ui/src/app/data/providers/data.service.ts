import { Injectable } from '@angular/core';

import { BaseDataService } from './base-data.service';
import { ClientDataService } from './client-data.service';
import { FacetDataService } from './facet-data.service';
import { ProductDataService } from './product-data.service';
import { UserDataService } from './user-data.service';

@Injectable()
export class DataService {
    user: UserDataService;
    product: ProductDataService;
    client: ClientDataService;
    facet: FacetDataService;

    constructor(baseDataService: BaseDataService) {
        this.user = new UserDataService(baseDataService);
        this.product = new ProductDataService(baseDataService);
        this.client = new ClientDataService(baseDataService);
        this.facet = new FacetDataService(baseDataService);
    }
}

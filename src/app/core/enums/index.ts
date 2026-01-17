import { KeyValue } from "@angular/common";

export enum ComponentTypes {
   Fixed = 1,
   Variable = 2
}


export enum Classification {
   Info = 1,
   Earning = 2,
   Deduction = 3
}

export const calculation: Array<KeyValue<number, string>> = [
   { key: 1, value: 'Raw Value' },
   { key: 2, value: 'Days' },
   { key: 3, value: 'Percentage' }
];


export enum UserStatus {
   Active = 'Active',
   Inactive = 'Inactive',
   Pending = 'Pending',
   Expired = 'Expired'
}

export enum Status {
   All = 0,
   Pending = 1,
   Accepted = 2,
   Rejected = 3,
   Cancelled = 4,
   Expired = 5
}
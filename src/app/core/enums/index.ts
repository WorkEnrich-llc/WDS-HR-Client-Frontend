import { KeyValue } from "@angular/common";

export enum ComponentTypes {
   Recurring = 1,
   Monthly = 2,
   Fixed = 3
}


export enum Classification {
   Earning = 1,
   Deduction = 2
}

export const calculation: Array<KeyValue<number, string>> = [
   { key: 1, value: 'Raw Value' },
   { key: 2, value: 'Days' },
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
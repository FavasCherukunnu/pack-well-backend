import Express from 'express';

 interface RequestBody<T> extends Express.Request  {
    body: T,
    
} 

export type TypedRequestBody<T> = RequestBody<T>&{_id?:string}
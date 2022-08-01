import { Type } from "@angular/core";
import { Injectable } from "@angular/core";
import "reflect-metadata";

export interface ExampleInterface {
  value: string;
}

export type ExampleConstructor = new (value: string) => ExampleInterface;

export type ExampleType = <T extends ExampleConstructor>(target: T) => void;

const exampleMetadataKey = Symbol("exampleMetadataKey");

export function ExampleDecorator(data: any): ExampleType {
  return (target: new (value: string) => ExampleInterface): void => {
    Reflect.defineMetadata(exampleMetadataKey, [data], target);
  };
}

@Injectable({
  providedIn: "root",
})
@ExampleDecorator({})
export class ExampleClass implements ExampleInterface {
  constructor(public value: string) {}
}

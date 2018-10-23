/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare interface String {
  padStart(targetLength : number,padString : string) : string;
}
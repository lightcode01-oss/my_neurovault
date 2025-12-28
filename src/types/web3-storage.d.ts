declare module 'web3.storage' {
  export class Web3Storage {
    constructor(opts: { token: string });
    put(files: any[], options?: any): Promise<string>;
    get(cid: string): Promise<any>;
  }
  export default Web3Storage;
}

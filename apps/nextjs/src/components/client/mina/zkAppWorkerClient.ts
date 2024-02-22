"use client";

/* eslint-disable */
import { Object3D } from "@zkarcade/mina/src/structs";
import { fetchAccount, Field, PublicKey } from "o1js";

import type {
  WorkerFunctions,
  ZkappWorkerReponse,
  ZkappWorkerRequest,
} from "./zkAppWorker";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToBerkeley() {
    return this._call("setActiveInstanceToBerkeley", {});
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call("initZkappInstance", {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getPlayer1ObjectHash(): Promise<Field> {
    const result = await this._call("getPlayer1ObjectHash", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getPlayer2ObjectHash(): Promise<Field> {
    const result = await this._call("getPlayer2ObjectHash", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createcommitPlayer1ObjectTransaction(objectHash: string) {
    return this._call("createcommitPlayer1ObjectTransaction", {
      objectHash: objectHash,
    });
  }

  createcommitPlayer2ObjectTransaction(objectHash: string) {
    return this._call("createcommitPlayer2ObjectTransaction", {
      objectHash: objectHash,
    });
  }

  createvalidatePlayer1RoomTransaction(room: string, object: string) {
    return this._call("createvalidatePlayer1RoomTransaction", {
      room: room,
      object: object,
    });
  }

  createvalidatePlayer2RoomTransaction(room: string, object: string) {
    return this._call("createvalidatePlayer2RoomTransaction", {
      room: room,
      object: object,
    });
  }

  createProveTransaction() {
    return this._call("createProveTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkAppWorker.ts", import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id]!.resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
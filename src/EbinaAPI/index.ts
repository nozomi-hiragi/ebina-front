import { startAuthentication } from "@simplewebauthn/browser";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { UnauthorizedError } from "../components/UnauthorizedErrorBoundary";
import { LocalStorage } from "../localstorage";
import { TypeApi } from "../types";
import PathBuilder from "./pathBuilder";

export const newEbinaURL = (path: string) =>
  new URL(`${lsServer.get()}/ebina${path}`);

export const fetchWithToken = (
  url: URL,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  token: string,
  body?: BodyInit | null,
) =>
  fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body,
  }).then((res) => {
    if (res.status === 401) throw new UnauthorizedError();
    return res;
  });

export const getEbina = (
  path: string,
  token: string,
) => fetchWithToken(newEbinaURL(path), "GET", token);

export const postEbina = (
  path: string,
  token: string,
  body?: BodyInit | null,
) => fetchWithToken(newEbinaURL(path), "POST", token, body);

export const putEbina = (
  path: string,
  token: string,
  body?: BodyInit | null,
) => fetchWithToken(newEbinaURL(path), "PUT", token, body);

export const deleteEbina = (
  path: string,
  token: string,
) => fetchWithToken(newEbinaURL(path), "DELETE", token);

export const postEbinaWithWA = (
  path: string,
  token: string,
  body?: BodyInit | null,
) =>
  postEbina(path, token, body).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startAuthentication(options)).then((result) =>
    postEbina(path, token, JSON.stringify(result))
  );

export const putEbinaWithWA = (
  path: string,
  token: string,
  body?: BodyInit | null,
) =>
  putEbina(path, token, body).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startAuthentication(options)).then((result) =>
    putEbina(path, token, JSON.stringify(result))
  );

class EbinaApiError extends Error {
  status: number;
  constructor(res: AxiosResponse<any, any>) {
    super(res.data);
    this.name = "EbinaApiError";
    this.status = res.status;
  }
}

export type WebAuthnSetting = {
  rpName: string;
  rpIDType: "variable" | "static";
  rpID?: string;
  attestationType?: AttestationConveyancePreference;
};

type MongoDBSettings = {
  port: number;
  username: "env" | string;
  password: "env" | string;
};

export type CronItem = {
  enable: boolean;
  pattern: string;
  function: string;
};

export type NginxConf = {
  hostname: string;
  port: number | "koujou";
  www?: boolean;
};

export const lsServer = new LocalStorage("server");

class EbinaAPI {
  private url: URL | null = null;
  private ax: AxiosInstance = axios.create();
  private token: string | undefined;

  constructor() {
    this.url = EbinaAPI.stou(lsServer.get());
    this.token = undefined;
    this.apply();
  }

  private static stou(url: string | undefined) {
    return url ? new URL(url) : null;
  }

  public setURL(url: string | undefined) {
    this.url = EbinaAPI.stou(url);
    lsServer.set(url);
    this.apply();
  }

  public setToken(token: string | undefined) {
    this.token = token;
    this.apply();
  }

  private apply() {
    this.ax.defaults.baseURL = this.url ? this.url.origin : undefined;
    this.ax.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
  }

  private checkURL() {
    if (!this.url) throw Error("URL did not set");
  }

  hasToken() {
    return this.token !== undefined;
  }

  async post<D>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return await this.ax.post(url, data, config).catch((err) => {
      if (!axios.isAxiosError(err) || !err.response) throw err;
      return err.response;
    });
  }

  async get<D>(url: string, config?: AxiosRequestConfig<D>) {
    return await this.ax.get(url, config).catch((err) => {
      if (!axios.isAxiosError(err) || !err.response) throw err;
      return err.response;
    });
  }

  async put<D>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return await this.ax.put(url, data, config).catch((err) => {
      if (!axios.isAxiosError(err) || !err.response) throw err;
      return err.response;
    });
  }

  async patch<D>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return await this.ax.patch(url, data, config).catch((err) => {
      if (!axios.isAxiosError(err) || !err.response) throw err;
      return err.response;
    });
  }

  async delete<D>(url: string, config?: AxiosRequestConfig<D>) {
    return await this.ax.delete(url, config).catch((err) => {
      if (!axios.isAxiosError(err) || !err.response) throw err;
      return err.response;
    });
  }

  // Apps

  // アプリ配列取得
  // 200 名前ら
  public async getAppNames() {
    this.checkURL();
    return await this.get(PathBuilder.app).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as string[];
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // アプリ作成
  // 200 OK
  // 400 情報足らない
  public async createApp(name: string) {
    this.checkURL();
    return await this.post(PathBuilder.appWith(name).path).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // アプリ削除 ゴミ箱に移動
  // 200 OK
  // 404 アプリない
  // 500 フォルダ移動ミスった
  public async deleteApp(name: string) {
    this.checkURL();
    return await this.delete(PathBuilder.appWith(name).path).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 401:
        case 404:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // API

  // API起動状態取得
  // 200 { status: 'started' | 'stop', started_at: number }
  public async getAPIStatus(appName: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).api.status)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as {
              status: "started" | "stop";
              started_at: number;
            };
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // API起動状態更新
  // { status: 'start' | 'stop' }
  // 200 できた
  // 400 情報おかしい
  // 500 起動できなかった
  public async updateAPIStatus(appName: string, status: "start" | "stop") {
    this.checkURL();
    return await this.put(PathBuilder.appWith(appName).api.status, { status })
      .then((res) => {
        switch (res.status) {
          case 200:
            return;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // API一覧取得
  // 200 { path, api }
  public async getAPIs(appName: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).api.endpoint)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as { path: string; api: any }[];
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // API作成
  // :path
  // { name, method, type, value }
  // 200 OK
  // 400 情報おかしい
  public async createPath(appName: string, path: string, api: TypeApi) {
    this.checkURL();
    return await this.post(
      PathBuilder.appWith(appName).api.endpointWith(path),
      api,
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // API取得
  // :path
  // 200 API
  // 400 情報おかしい
  // 404 ない
  public async getAPI(appName: string, path: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).api.endpointWith(path))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as TypeApi;
          case 400:
          case 401:
          case 404:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // API更新
  // :path
  // 200 OK
  // 400 情報おかしい
  public async updateAPI(appName: string, path: string, api: TypeApi) {
    this.checkURL();
    return await this.put(
      PathBuilder.appWith(appName).api.endpointWith(path),
      api,
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // API削除
  // 200 OK
  // 400 情報おかしい
  // 404 パスない
  public async deleteAPI(appName: string, path: string) {
    this.checkURL();
    return await this.delete(
      PathBuilder.appWith(appName).api.endpointWith(path),
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        case 404:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ポート取得
  // 200 { port: number }
  public async getPort(appName: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).api.port).then((res) => {
      switch (res.status) {
        case 200:
          return res.data.port as number;
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ポート設定
  // { port: number }
  // 200 OK
  // 400 情報おかしい
  public async updatePort(appName: string, port: number) {
    this.checkURL();
    return await this.put(PathBuilder.appWith(appName).api.port, { port })
      .then((res) => {
        switch (res.status) {
          case 200:
            return;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // スクリプトファイル作成
  // :path
  // {}: string?
  // 200 OK
  // 400 情報おかしい
  // 409 もうある
  // 500 ファイル関係ミスった
  public async createScript(
    appName: string,
    path: string,
    data: string | undefined = undefined,
  ) {
    this.checkURL();
    return await this.post(
      PathBuilder.appWith(appName).scriptWith(path),
      data,
      { headers: { "content-type": "text/plain" } },
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        case 409:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // スクリプトファイル一覧取得
  // 200 一覧
  // 500 ファイル読めなかった
  public async getScriptList(appName: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).script).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as string[];
        case 401:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // スクリプトファイル取得
  // :path
  // 200 text
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async getScript(appName: string, path: string) {
    this.checkURL();
    return await this.get(PathBuilder.appWith(appName).scriptWith(path))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as string;
          case 400:
          case 401:
          case 404:
          case 409:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // スクリプトファイル更新
  // :path
  // 200 OK
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async updateScript(appName: string, path: string, data: string) {
    this.checkURL();
    return await this.patch(
      PathBuilder.appWith(appName).scriptWith(path),
      data,
      { headers: { "content-type": "text/plain" } },
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 400:
        case 401:
        case 409:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // スクリプトファイル削除
  // :path
  // 200 OK
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async deleteScript(appName: string, path: string) {
    this.checkURL();
    return await this.delete(PathBuilder.appWith(appName).scriptWith(path))
      .then((res) => {
        switch (res.status) {
          case 200:
            return;
          case 401:
          case 404:
          case 409:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // WebAuthn設定取得
  // 200 設定
  // 400 情報おかしい
  // 401 認証おかしい
  // 503 ファイル関係ミスった
  public async getWebAuthnSettings() {
    this.checkURL();
    return await this.get(PathBuilder.settings.webauthn)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as WebAuthnSetting;
          case 503:
            return undefined;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // WebAuthn設定保存
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async setWebAuthnBSettings(settings: WebAuthnSetting) {
    this.checkURL();
    return await this.post(PathBuilder.settings.webauthn, settings)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // mongodb設定取得
  // 200 設定
  // 400 情報おかしい
  // 401 認証おかしい
  // 503 ファイル関係ミスった
  public async getMongoDBSettings() {
    this.checkURL();
    return await this.get(PathBuilder.settings.mongodb).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as MongoDBSettings;
        case 400:
        case 401:
        case 503:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // mongodb設定保存
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async setMongoDBSettings(settings: MongoDBSettings) {
    this.checkURL();
    return await this.post(PathBuilder.settings.mongodb, settings)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // DB一覧
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  public async getDatabases() {
    this.checkURL();
    return await this.get(PathBuilder.database.path).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as {
            name: string;
            sizeOnDisk?: number;
            empty?: false;
          }[];
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // Collection一覧
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  public async getCollections(dbName: string) {
    this.checkURL();
    return await this.get(PathBuilder.databaseWith(dbName).path).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as string[];
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // docs
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 エラー
  public async getDocments(dbName: string, colName: string) {
    this.checkURL();
    return await this.get(
      PathBuilder.databaseWith(dbName).collection(colName).find,
    ).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as any[];
        case 500:
          return res.data;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // users
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 エラー
  public async getDBUsers() {
    this.checkURL();
    return await this.get(PathBuilder.database.user).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as {
            user: string;
            roles: { role: string; db: string }[];
          }[];
        case 500:
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // create mongodb uset
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async createMongoDBUser(user: {
    username: string;
    password: string;
    roles: { role: string; db: string }[];
  }) {
    this.checkURL();
    return await this.post(PathBuilder.database.user, user)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // delete mongodb uset
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async deleteMongoDBUser(username: string) {
    this.checkURL();
    return await this.delete(PathBuilder.database.userWith(username))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // get cron list
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async getCronList(appName: string): Promise<string[]> {
    this.checkURL();
    return this.get(PathBuilder.appWith(appName).cron).then((res) => {
      switch (res.status) {
        case 200:
          return res.data as string[];
        case 400:
        case 401:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // get cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async getCron(appName: string, cronName: string): Promise<CronItem> {
    this.checkURL();
    return this.get(PathBuilder.appWith(appName).cronWith(cronName))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as CronItem;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // create cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async createCron(
    appName: string,
    cronName: string,
    cronItem: CronItem,
  ): Promise<CronItem> {
    this.checkURL();
    return this.post(PathBuilder.appWith(appName).cronWith(cronName), cronItem)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // update cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 404
  // 500 ファイル関係ミスった
  public async updateCron(
    appName: string,
    cronName: string,
    cronItem: CronItem,
  ): Promise<CronItem> {
    this.checkURL();
    return this.patch(
      PathBuilder.appWith(appName).cronWith(cronName),
      cronItem,
    ).then((res) => {
      switch (res.status) {
        case 200:
          return res.data;
        case 400:
        case 401:
        case 404:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // delete cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async deleteCron(
    appName: string,
    cronName: string,
  ): Promise<CronItem> {
    this.checkURL();
    return this.delete(PathBuilder.appWith(appName).cronWith(cronName))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // ルート状態
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRoutingStatus(): Promise<string> {
    this.checkURL();
    return this.get(PathBuilder.routing.status).then((res) => {
      switch (res.status) {
        case 200:
          return res.data;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ルーター状態更新
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 失敗
  // 503 本部ない
  public async updateRouter(status: string): Promise<boolean> {
    this.checkURL();
    return this.put(PathBuilder.routing.status, { status }).then((res) => {
      switch (res.status) {
        case 200:
          return true;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
        case 500:
        case 503:
          return false;
      }
    });
  }

  // ルート一覧
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRouteList(): Promise<string[]> {
    this.checkURL();
    return this.get(PathBuilder.routing.path).then((res) => {
      switch (res.status) {
        case 200:
          return res.data;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ルート
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRoute(name: string): Promise<NginxConf> {
    this.checkURL();
    return this.get(PathBuilder.routing.route(name)).then((res) => {
      switch (res.status) {
        case 200:
          return res.data;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ルート設定
  // 201 変わった
  // 200 変わんない
  // 400 情報おかしい
  // 401 認証おかしい
  public async setRoute(name: string, conf: NginxConf): Promise<boolean> {
    this.checkURL();
    return this.put(PathBuilder.routing.route(name), conf).then((res) => {
      switch (res.status) {
        case 201:
          return true;
        case 200:
          return false;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ルート作成
  // 201 OK
  // 400 情報おかしい
  // 401 認証おかしい
  // 409 もうある
  public async newRoute(name: string, conf: NginxConf): Promise<boolean> {
    this.checkURL();
    return this.post(PathBuilder.routing.route(name), conf)
      .then((res) => {
        switch (res.status) {
          case 201:
            return true;
          case 409:
            return false;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // ルート削除
  // 200 OK
  // 400 情報おかしい
  // 401 認証おかしい
  public async deleteRoute(name: string): Promise<boolean> {
    this.checkURL();
    return this.delete(PathBuilder.routing.route(name)).then((res) => {
      switch (res.status) {
        case 200:
          return true;
        case 400:
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }
}

export default new EbinaAPI();

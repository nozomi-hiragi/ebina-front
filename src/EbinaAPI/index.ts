import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { UnauthorizedError } from "../components/UnauthorizedErrorBoundary";
import { LocalStorage } from "../localstorage";
import { TypeApi } from "../types";
import PathBuilder from "./pathBuilder";

export const myFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  return await fetch(input, init).then((ret) => {
    if (ret.status === 401) throw new UnauthorizedError();
    return ret;
  });
};

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

  private setToken(token: string | undefined) {
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

  // User

  // メンバー作成要求
  // { id, name, pass }
  // 201 できた
  // 400 情報足らない
  // 404 IDがもうある
  public async memberRegistRequest(
    user: { id: string; name: string; pass: string },
  ) {
    this.checkURL();
    return await this.post(PathBuilder.member.regist.option, user)
      .then((res) => {
        switch (res.status) {
          case 201:
            return res.data;
          case 400:
          case 404:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // メンバー作成認証
  // { id, result, token }
  // 200 できた
  // 400 情報足らない
  // 401 トークンちがう
  // 404 IDがもうある
  public async memberRegistVerify(
    body: { id: string; result: any; token: string },
  ) {
    this.checkURL();
    return await this.post(PathBuilder.member.regist.verify, body)
      .then((res) => {
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

  // ログイン
  // { type, id, pass }
  // 200 トークン
  // 400 情報足らない
  // 401 パスワードが違う
  // 404 メンバーない
  // 405 パスワードが設定されてない
  // 406 パスワードはだめ
  public async loginWithPassword(id: string, pass: string) {
    this.checkURL();
    return await this.post(
      PathBuilder.i.login.path,
      { type: "password", id, pass },
    ).then((res) => {
      switch (res.status) {
        case 200:
          this.setToken(res.data);
          return res.data as string;
        case 400:
        case 401:
        case 404:
        case 405:
        case 406:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // ログアウト サーバー内のトークン消す
  // 200 消せた
  // 401 無かった
  public async logout() {
    this.checkURL();
    return await this.post(PathBuilder.i.logout).then((res) => {
      switch (res.status) {
        case 200:
          this.setToken(undefined);
          return;
        case 401:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // パスワード更新
  // 200 変えれた
  // 202 認証して
  // 400 足らない
  // 401 認証できてない
  // 403 許可されてない
  // 404 データない
  // 405 パスワードのデータおかしい
  public async updatePassword(
    options: any,
  ): Promise<{ ok: boolean; options?: any; status?: number }> {
    this.checkURL();
    return await this.put(PathBuilder.i.password, options).then((res) => {
      switch (res.status) {
        case 200:
          return { ok: true };
        case 202:
          return { ok: true, options: res.data };
        default:
          return { ok: false, status: res.status };
      }
    });
  }

  // 登録オプション取得
  // origin:
  // 200 オプション
  // 400 オリジンヘッダない
  // 404 メンバーがない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnRegistOptions(deviceName: string) {
    this.checkURL();
    return await this.get(PathBuilder.i.webauthn.regist, {
      params: { deviceName },
    }).then((res) => {
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

  // 登録
  // origin:
  // { ...credential, deviceName }
  // 200 OK
  // 400 情報おかしい
  // 401 チャレンジ失敗
  // 404 メンバーがない
  // 409 チャレンジ控えがない
  // 410 チャレンジ古い
  // 500 WebAuthnの設定おかしい
  public async sendWebAuthnRegistCredential(credential: any) {
    this.checkURL();
    return await this.post(PathBuilder.i.webauthn.regist, credential)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as string[];
          case 400:
          case 401:
          case 404:
          case 409:
          case 410:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // 確認用オプション取得
  // origin:
  // ?names[]
  // 200 オプション
  // 400 情報足りない
  // 404 メンバーがない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnVerifyOptions(deviceNames?: string[]) {
    this.checkURL();
    return await this.get(PathBuilder.i.webauthn.verify, {
      params: { deviceNames: deviceNames?.join(",") },
    }).then((res) => {
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

  // 認証
  // origin:
  // { ...credential }
  // 200 OK
  // 400 情報おかしい
  // 401 チャレンジ失敗
  // 404 ものがない
  // 405 パスワードが設定されてない
  // 409 チャレンジ控えがない
  // 410 チャレンジ古い
  // 500 WebAuthnの設定おかしい
  public async sendWebAuthnVerifyCredential(credential: any) {
    this.checkURL();
    return await this.post(PathBuilder.i.webauthn.verify, credential)
      .then((res) => {
        switch (res.status) {
          case 200:
            return;
          case 400:
          case 401:
          case 404:
          case 405:
          case 409:
          case 410:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // ログイン用オプション取得
  // origin:
  // 200 オプション
  // 400 情報足りない
  // 500 WebAuthnの設定おかしい
  public async getLoginOptions(id?: string) {
    this.checkURL();
    return await this.post(PathBuilder.i.login.option, { id })
      .then((res) => {
        switch (res.status) {
          case 202:
            return res.data as
              | { type: "WebAuthn"; options: any; sessionId: string }
              | { type: "Password" }
              | { type: "Regist"; token: string };
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // WebAuthnでログイン
  // { type, id, pass }
  // 200 トークン
  // 400 情報足らない
  // 404 メンバーない
  // 500 WebAuthn設定おかしい
  public async loginWithWAOption(result: any, sessionId: string) {
    this.checkURL();
    return await this.post(PathBuilder.i.login.verify, { sessionId, result })
      .then((ret) => {
        switch (ret.status) {
          case 200:
            this.setToken(ret.data);
            return ret.data as string;
          case 400:
          case 404:
          case 500:
          default:
            throw new EbinaApiError(ret);
        }
      });
  }

  // デバイスら情報取得
  // origin:
  // ?names
  // 200 空でも返す
  // 400 情報足りない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnDeviceNames() {
    this.checkURL();
    return await this.get(PathBuilder.i.webauthn.device)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as string[];
          case 500:
            return undefined;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // デバイス有効確認
  // origin:
  // :deviceName
  // 200 OK
  // 208 もうある
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async checkEnableWebAuthnDevice(deviceName: string) {
    this.checkURL();
    return await this.get(PathBuilder.i.webauthn.deviceWith(deviceName).enable)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as boolean;
          case 404:
          case 500:
          default:
            throw new EbinaApiError(res);
        }
      });
  }

  // デバイス有効
  // origin:
  // :deviceName
  // 200 OK
  // 208 もうある
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async enableWebAuthnDevice(deviceName: string) {
    this.checkURL();
    return await this.post(
      PathBuilder.i.webauthn.deviceWith(deviceName).enable,
    ).then((res) => {
      switch (res.status) {
        case 200:
        case 208:
          return;
        case 404:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // デバイス無効
  // origin:
  // :deviceName
  // 200 OK
  // 208 もうない
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async disableWebAuthnDevice(deviceName: string) {
    this.checkURL();
    return await this.post(
      PathBuilder.i.webauthn.deviceWith(deviceName).disable,
    ).then((res) => {
      switch (res.status) {
        case 200:
        case 208:
          return;
        case 404:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // デバイスら削除
  // origin:
  // :deviceName
  // ?names
  // 200 OK
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async deleteWebAuthnDevice(deviceName: string) {
    this.checkURL();
    return await this.delete(
      PathBuilder.i.webauthn.deviceWith(deviceName).path,
    ).then((res) => {
      switch (res.status) {
        case 200:
          return;
        case 404:
        case 500:
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // メンバー配列取得 ID無いなら全部
  // ?ids
  // 200 空でも返す
  public async getUsers() {
    this.checkURL();
    return await this.get(PathBuilder.member.path).then((res) => {
      switch (res.status) {
        case 200:
          return res.data;
        default:
          throw new EbinaApiError(res);
      }
    });
  }

  // メンバー配列削除
  // ?ids
  // 200 全部できた
  // 206 一部できた
  // 404 全部できない
  public async deleteUsers(ids: string[]) {
    this.checkURL();
    return await this.delete(PathBuilder.member.path, {
      params: { ids: ids.join(",") },
    }).then((res) => {
      switch (res.status) {
        case 200:
        case 206:
          return;
        case 401:
        case 404:
        default:
          throw new EbinaApiError(res);
      }
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

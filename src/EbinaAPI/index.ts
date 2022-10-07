import axios, { AxiosInstance, AxiosResponse } from "axios";
import jwtDecode from "jwt-decode";
import { Mutex } from "async-mutex";
import * as LS from "../localstorageDelegate";
import { TypeApi } from "../types";
import PathBuilder from "./pathBuilder";

class EbinaApiError extends Error {
  status: number;
  constructor(res: AxiosResponse<any, any>) {
    super(res.data);
    this.name = "EbinaApiError";
    this.status = res.status;
  }
}

export class ExpiredRefreshTokenError extends Error {
  constructor() {
    super("refresh token was expired");
    this.name = "ExpiredRefreshTokenError";
  }
}

type JWT = {
  id: string;
  exp: number;
};

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
  port: number;
  www?: boolean;
};

class EbinaAPI {
  private url: URL | null = null;
  private ax: AxiosInstance = axios.create();
  private token: string | undefined;
  private refreshToken: string | undefined;
  private mutex = new Mutex();

  constructor() {
    this.url = EbinaAPI.stou(LS.get(LS.ITEM.Server));
    this.token = LS.get(LS.ITEM.Token) ?? undefined;
    this.refreshToken = LS.get(LS.ITEM.RefreshToken) ?? undefined;
    this.apply();
  }

  private static stou(url: string | null) {
    return url ? new URL(url) : null;
  }

  public setURL(url: string | null) {
    this.url = EbinaAPI.stou(url);
    LS.set(LS.ITEM.Server, url);
    this.apply();
  }

  private setTokens(tokens: { token: string; refreshToken: string } | null) {
    if (tokens) {
      this.token = tokens.token;
      this.refreshToken = tokens.refreshToken;
    } else {
      this.token = undefined;
      this.refreshToken = undefined;
    }
    LS.set(LS.ITEM.Token, this.token ?? null);
    LS.set(LS.ITEM.RefreshToken, this.refreshToken ?? null);
    this.apply();
  }

  private apply() {
    this.ax.defaults.baseURL = this.url ? this.url.origin : undefined;
    this.ax.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
  }

  private async preCheck() {
    this.checkURL();
    await this.checkExired();
  }

  private checkURL() {
    if (!this.url) throw Error("URL did not set");
  }

  async checkExired() {
    await this.mutex.runExclusive(async () => {
      const now = Date.now() * 0.001;

      if (!this.refreshToken) throw new ExpiredRefreshTokenError();
      const decodedRefToken = jwtDecode(this.refreshToken!) as JWT;
      const refTokenExp = decodedRefToken.exp;
      if (refTokenExp < now) {
        this.setTokens(null);
        console.error("ref token expired");
        throw new ExpiredRefreshTokenError();
      }

      if (!this.token) throw new Error("no token");
      const decodedToken = jwtDecode(this.token) as JWT;
      const tokenExp = decodedToken.exp;
      if (tokenExp < now) {
        console.log("token expired");
        await this.refreshTokens().then(() => {
          console.log("token refreshed");
        }).catch(() => {
          console.log("failed refresh token");
        });
        return;
      }
    });
  }

  // User

  // メンバー作成
  // { id, name, pass }
  // 201 できた
  // 400 情報足らない
  // 406 IDがもうある
  public async userRegist(user: { id: string; name: string; pass: string }) {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.member, user);
    switch (res.status) {
      case 201:
        break;
      case 400:
      case 406:
      default:
        throw new EbinaApiError(res);
    }
  }

  // ログイン
  // { type, id, pass }
  // 200 ユーザーとトークン
  // 400 情報足らない
  // 401 パスワードが違う
  // 404 メンバーない
  // 405 パスワードが設定されてない
  public async login(
    body:
      | { type: "password"; id: string; pass: string }
      | { type: "public-key"; [key: string]: any },
  ) {
    this.checkURL();
    const res = await this.ax.post(PathBuilder.i.login, body);
    switch (res.status) {
      case 200:
        this.setTokens(res.data.tokens);
        return res.data.member;
      case 400:
      case 401:
      case 404:
      case 405:
      default:
        throw new EbinaApiError(res);
    }
  }

  // トークン更新
  // 200 トークン
  // 401 だめ
  public async refreshTokens() {
    this.checkURL();
    const res = await this.ax.post(PathBuilder.i.refresh, {
      refreshToken: this.refreshToken,
    });
    switch (res.status) {
      case 200:
        this.setTokens(res.data);
        return;
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // ログアウト サーバー内のトークン消す
  // 200 消せた
  // 401 無かった
  public async logout() {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.i.logout);
    switch (res.status) {
      case 200:
        this.setTokens(null);
        return;
      case 401:
      default:
        throw new EbinaApiError(res);
    }
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
    await this.preCheck();
    return await this.ax.put(PathBuilder.i.password, options)
      .then((ret) => ({
        ok: true,
        options: ret.status === 202 ? ret.data : undefined,
      }))
      .catch((err) => {
        if (!axios.isAxiosError(err)) throw err;
        if (!err.response) throw err;
        return { ok: false, status: err.response.status };
      });
  }

  // 登録オプション取得
  // origin:
  // 200 オプション
  // 400 オリジンヘッダない
  // 404 メンバーがない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnRegistOptions() {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.i.webauthn.regist);
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
  public async sendWebAuthnRegistCredential(
    credential: any,
    deviceName: string,
  ) {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.i.webauthn.regist, {
      ...credential,
      deviceName,
    });
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
  }

  // 確認用オプション取得
  // origin:
  // ?names[]
  // 200 オプション
  // 400 情報足りない
  // 404 メンバーがない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnVerifyOptions(deviceNames?: string[]) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.i.webauthn.verify, {
      params: { deviceNames: deviceNames?.join(",") },
    });
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
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.i.webauthn.verify, credential);
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
  }

  // ログイン用オプション取得
  // origin:
  // 200 オプション
  // 400 情報足りない
  // 500 WebAuthnの設定おかしい
  public async getLoginOptions(id: string) {
    this.checkURL();
    return await this.ax.get(PathBuilder.i.loginWith(id))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
          default:
            throw new EbinaApiError(res);
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const res = err.response!;
          throw new EbinaApiError(res);
        } else {
          throw err;
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
    await this.preCheck();
    return await this.ax.get(PathBuilder.i.webauthn.device)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as string[];
          default:
            throw new EbinaApiError(res);
        }
      })
      .catch((err) => {
        if (!axios.isAxiosError(err)) throw err;
        if (!err.response) throw err;
        switch (err.response.status) {
          case 500:
            return undefined;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(err.response);
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
    await this.preCheck();
    const res = await this.ax.get(
      PathBuilder.i.webauthn.deviceWith(deviceName).enable,
    );
    switch (res.status) {
      case 200:
        return res.data as boolean;
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // デバイス有効
  // origin:
  // :deviceName
  // 200 OK
  // 208 もうある
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async enableWebAuthnDevice(deviceName: string) {
    await this.preCheck();
    const res = await this.ax.post(
      PathBuilder.i.webauthn.deviceWith(deviceName).enable,
    );
    switch (res.status) {
      case 200:
      case 208:
        return;
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // デバイス無効
  // origin:
  // :deviceName
  // 200 OK
  // 208 もうない
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async disableWebAuthnDevice(deviceName: string) {
    await this.preCheck();
    const res = await this.ax.post(
      PathBuilder.i.webauthn.deviceWith(deviceName).disable,
    );
    switch (res.status) {
      case 200:
      case 208:
        return;
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // デバイスら削除
  // origin:
  // :deviceName
  // ?names
  // 200 OK
  // 404 みつからない
  // 500 WebAuthnの設定おかしい
  public async deleteWebAuthnDevice(deviceName: string) {
    await this.preCheck();
    const res = await this.ax.delete(
      PathBuilder.i.webauthn.deviceWith(deviceName).path,
    );
    switch (res.status) {
      case 200:
        return;
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // メンバー配列取得 ID無いなら全部
  // ?ids
  // 200 空でも返す
  public async getUsers() {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.member);
    switch (res.status) {
      case 200:
        return res.data;
      default:
        throw new EbinaApiError(res);
    }
  }

  // メンバー配列削除
  // ?ids
  // 200 全部できた
  // 206 一部できた
  // 404 全部できない
  public async deleteUsers(ids: string[]) {
    await this.preCheck();
    const res = await this.ax.delete(PathBuilder.member, {
      params: { ids: ids.join(",") },
    });
    switch (res.status) {
      case 200:
      case 206:
        return;
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res);
    }
  }

  // Apps

  // アプリ配列取得
  // 200 名前ら
  public async getAppNames() {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.app);
    switch (res.status) {
      case 200:
        return res.data as string[];
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // アプリ作成
  // 200 OK
  // 400 情報足らない
  public async createApp(name: string) {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.appWith(name).path);
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // アプリ削除 ゴミ箱に移動
  // 200 OK
  // 404 アプリない
  // 500 フォルダ移動ミスった
  public async deleteApp(name: string) {
    await this.preCheck();
    const res = await this.ax.delete(PathBuilder.appWith(name).path);
    switch (res.status) {
      case 200:
        return;
      case 401:
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API

  // API起動状態取得
  // 200 { status: 'started' | 'stop', started_at: number }
  public async getAPIStatus(appName: string) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.appWith(appName).api.status);
    switch (res.status) {
      case 200:
        return res.data as { status: "started" | "stop"; started_at: number };
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API起動状態更新
  // { status: 'start' | 'stop' }
  // 200 できた
  // 400 情報おかしい
  // 500 起動できなかった
  public async updateAPIStatus(appName: string, status: "start" | "stop") {
    await this.preCheck();
    const res = await this.ax.put(PathBuilder.appWith(appName).api.status, {
      status,
    });
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API一覧取得
  // 200 { path, api }
  public async getAPIs(appName: string) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.appWith(appName).api.endpoint);
    switch (res.status) {
      case 200:
        return res.data as { path: string; api: any }[];
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API作成
  // :path
  // { name, method, type, value }
  // 200 OK
  // 400 情報おかしい
  public async createPath(appName: string, path: string, api: TypeApi) {
    await this.preCheck();
    const res = await this.ax.post(
      PathBuilder.appWith(appName).api.endpointWith(path),
      api,
    );
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API取得
  // :path
  // 200 API
  // 400 情報おかしい
  // 404 ない
  public async getAPI(appName: string, path: string) {
    await this.preCheck();
    const res = await this.ax.get(
      PathBuilder.appWith(appName).api.endpointWith(path),
    );
    switch (res.status) {
      case 200:
        return res.data as TypeApi;
      case 400:
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API更新
  // :path
  // 200 OK
  // 400 情報おかしい
  public async updateAPI(appName: string, path: string, api: TypeApi) {
    await this.preCheck();
    const res = await this.ax.put(
      PathBuilder.appWith(appName).api.endpointWith(path),
      api,
    );
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // API削除
  // 200 OK
  // 400 情報おかしい
  // 404 パスない
  public async deleteAPI(appName: string, path: string) {
    await this.preCheck();
    const res = await this.ax.delete(
      PathBuilder.appWith(appName).api.endpointWith(path),
    );
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res);
    }
  }

  // ポート取得
  // 200 { port: number }
  public async getPort(appName: string) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.appWith(appName).api.port);
    switch (res.status) {
      case 200:
        return res.data.port as number;
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // ポート設定
  // { port: number }
  // 200 OK
  // 400 情報おかしい
  public async updatePort(appName: string, port: number) {
    await this.preCheck();
    const res = await this.ax.put(PathBuilder.appWith(appName).api.port, {
      port,
    });
    switch (res.status) {
      case 200:
        return;
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res);
    }
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
    await this.preCheck();
    const res = await this.ax.post(
      PathBuilder.appWith(appName).scriptWith(path),
      data,
      { headers: { "content-type": "text/plain" } },
    );
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
  }

  // スクリプトファイル一覧取得
  // 200 一覧
  // 500 ファイル読めなかった
  public async getScriptList(appName: string) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.appWith(appName).script);
    switch (res.status) {
      case 200:
        return res.data as string[];
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // スクリプトファイル取得
  // :path
  // 200 text
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async getScript(appName: string, path: string) {
    await this.preCheck();
    const res = await this.ax.get(
      PathBuilder.appWith(appName).scriptWith(path),
    );
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
  }

  // スクリプトファイル更新
  // :path
  // 200 OK
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async updateScript(appName: string, path: string, data: string) {
    await this.preCheck();
    const res = await this.ax.patch(
      PathBuilder.appWith(appName).scriptWith(path),
      data,
      { headers: { "content-type": "text/plain" } },
    );
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
  }

  // スクリプトファイル削除
  // :path
  // 200 OK
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async deleteScript(appName: string, path: string) {
    await this.preCheck();
    const res = await this.ax.delete(
      PathBuilder.appWith(appName).scriptWith(path),
    );
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
  }

  // WebAuthn設定取得
  // 200 設定
  // 400 情報おかしい
  // 401 認証おかしい
  // 503 ファイル関係ミスった
  public async getWebAuthnSettings() {
    await this.preCheck();
    return await this.ax.get(PathBuilder.settings.webauthn)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as WebAuthnSetting;
          default:
            throw new EbinaApiError(res);
        }
      })
      .catch((err) => {
        if (!axios.isAxiosError(err)) throw err;
        if (!err.response) throw err;
        switch (err.response.status) {
          case 503:
            return undefined;
          case 400:
          case 401:
          default:
            throw new EbinaApiError(err.response);
        }
      });
  }

  // WebAuthn設定保存
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async setWebAuthnBSettings(settings: WebAuthnSetting) {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.settings.webauthn, settings);
    switch (res.status) {
      case 200:
        return res.data;
      case 400:
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // mongodb設定取得
  // 200 設定
  // 400 情報おかしい
  // 401 認証おかしい
  // 503 ファイル関係ミスった
  public async getMongoDBSettings() {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.settings.mongodb);
    switch (res.status) {
      case 200:
        return res.data as MongoDBSettings;
      case 400:
      case 401:
      case 503:
      default:
        throw new EbinaApiError(res);
    }
  }

  // mongodb設定保存
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async setMongoDBSettings(settings: MongoDBSettings) {
    await this.preCheck();
    const res = await this.ax.post(PathBuilder.settings.mongodb, settings);
    switch (res.status) {
      case 200:
        return res.data;
      case 400:
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res);
    }
  }

  // DB一覧
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  public async getDatabases() {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.database.path);
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
  }

  // Collection一覧
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  public async getCollections(dbName: string) {
    await this.preCheck();
    const res = await this.ax.get(PathBuilder.databaseWith(dbName).path);
    switch (res.status) {
      case 200:
        return res.data as string[];
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res);
    }
  }

  // docs
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 エラー
  public async getDocments(dbName: string, colName: string) {
    await this.preCheck();
    return await this.ax.get(
      PathBuilder.databaseWith(dbName).collection(colName).find,
    )
      .then((res) => {
        switch (res.status) {
          case 200:
          default:
            return res.data as any[];
        }
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 500:
              return err.response.data;
            case 400:
            case 401:
            default:
              if (!err.response) throw err;
              throw new EbinaApiError(err.response);
          }
        } else {
          throw err;
        }
      });
  }

  // users
  // 200 一覧
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 エラー
  public async getDBUsers() {
    await this.preCheck();
    return await this.ax.get(PathBuilder.database.user)
      .then((res) => {
        switch (res.status) {
          case 200:
          default:
            return res.data as {
              user: string;
              roles: { role: string; db: string }[];
            }[];
        }
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 500:
            case 400:
            case 401:
            default:
              if (!err.response) throw err;
              throw new EbinaApiError(err.response);
          }
        } else {
          throw err;
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
    await this.preCheck();
    return await this.ax.post(PathBuilder.database.user, user).then(
      (res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
      },
    ).catch((err) => {
      if (axios.isAxiosError(err)) {
        switch (err.response?.status) {
          case 400:
          case 401:
          case 500:
          default:
            throw new EbinaApiError(err.response!);
        }
      } else {
        throw err;
      }
    });
  }

  // delete mongodb uset
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async deleteMongoDBUser(username: string) {
    await this.preCheck();
    return await this.ax.delete(PathBuilder.database.userWith(username))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // get cron list
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async getCronList(appName: string): Promise<string[]> {
    await this.preCheck();
    return this.ax.get(PathBuilder.appWith(appName).cron)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as string[];
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // get cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async getCron(appName: string, cronName: string): Promise<CronItem> {
    await this.preCheck();
    return this.ax.get(PathBuilder.appWith(appName).cronWith(cronName))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data as CronItem;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
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
    await this.preCheck();
    return this.ax.post(
      PathBuilder.appWith(appName).cronWith(cronName),
      cronItem,
    )
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // update cron
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  // 500 ファイル関係ミスった
  public async updateCron(
    appName: string,
    cronName: string,
    cronItem: CronItem,
  ): Promise<CronItem> {
    await this.preCheck();
    return this.ax.patch(
      PathBuilder.appWith(appName).cronWith(cronName),
      cronItem,
    )
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
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
    await this.preCheck();
    return this.ax.delete(PathBuilder.appWith(appName).cronWith(cronName))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            case 500:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // ルート状態
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRoutingStatus(): Promise<string> {
    await this.preCheck();
    return this.ax.get(PathBuilder.routing.status)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
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
    await this.preCheck();
    return this.ax.put(PathBuilder.routing.status, { status })
      .then((res) => {
        switch (res.status) {
          case 200:
            return true;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
            case 500:
            case 503:
              return false;
          }
        } else {
          throw err;
        }
      });
  }

  // ルート一覧
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRouteList(): Promise<string[]> {
    await this.preCheck();
    return this.ax.get(PathBuilder.routing.path)
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // ルート
  // 200 ok
  // 400 情報おかしい
  // 401 認証おかしい
  public async getRoute(name: string): Promise<NginxConf> {
    await this.preCheck();
    return this.ax.get(PathBuilder.routing.route(name))
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.data;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // ルート設定
  // 201 変わった
  // 200 変わんない
  // 400 情報おかしい
  // 401 認証おかしい
  public async setRoute(name: string, conf: NginxConf): Promise<boolean> {
    await this.preCheck();
    return this.ax.put(PathBuilder.routing.route(name), conf)
      .then((res) => {
        switch (res.status) {
          case 201:
            return true;
          case 200:
            return false;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // ルート作成
  // 201 OK
  // 400 情報おかしい
  // 401 認証おかしい
  // 409 もうある
  public async newRoute(name: string, conf: NginxConf): Promise<boolean> {
    await this.preCheck();
    return this.ax.post(PathBuilder.routing.route(name), conf)
      .then((res) => {
        switch (res.status) {
          case 201:
            return true;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 409:
              return false;
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }

  // ルート削除
  // 200 OK
  // 400 情報おかしい
  // 401 認証おかしい
  public async deleteRoute(name: string): Promise<boolean> {
    await this.preCheck();
    return this.ax.delete(PathBuilder.routing.route(name))
      .then((res) => {
        switch (res.status) {
          case 200:
            return true;
        }
        throw new EbinaApiError(res);
      }).catch((err) => {
        if (axios.isAxiosError(err)) {
          switch (err.response?.status) {
            case 400:
            case 401:
            default:
              throw new EbinaApiError(err.response!);
          }
        } else {
          throw err;
        }
      });
  }
}

export default new EbinaAPI();

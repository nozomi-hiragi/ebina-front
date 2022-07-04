import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as LS from './localstorageDelegate';
import { TypeApi } from "./types";

class EbinaApiError extends Error {
  status: number
  constructor(res: AxiosResponse<any, any>) {
    super(res.data)
    this.name = "EbinaApiError"
    this.status = res.status
  }
}

class EbinaAPI {
  private url: URL | null = null
  private ax: AxiosInstance = axios.create()
  private token: string | null
  private refreshToken: string | null

  constructor() {
    this.url = EbinaAPI.stou(LS.get(LS.ITEM.Server))
    this.token = LS.get(LS.ITEM.Token)
    this.refreshToken = LS.get(LS.ITEM.RefreshToken)
    this.apply()
  }

  private static stou(url: string | null) { return url ? new URL(url) : null }

  public setURL(url: string | null) {
    this.url = EbinaAPI.stou(url)
    LS.set(LS.ITEM.Server, url)
    this.apply()
  }

  private setTokens(tokens: { token: string, refreshToken: string } | null) {
    if (tokens) {
      this.token = tokens.token
      this.refreshToken = tokens.refreshToken
    } else {
      this.token = null
      this.refreshToken = null
    }
    LS.set(LS.ITEM.Token, this.token)
    LS.set(LS.ITEM.RefreshToken, this.refreshToken)
    this.apply()
  }

  private apply() {
    this.ax.defaults.baseURL = this.url ? this.url.origin : undefined
    this.ax.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
  }

  private checkURL() { if (!this.url) throw Error('URL did not set') }

  // User

  // メンバー作成
  // { id, name, pass }
  // 201 できた
  // 400 情報足らない
  // 406 IDがもうある
  public async userRegist(user: { id: string, name: string, pass: string }) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user', user)
    switch (res.status) {
      case 201:
        break
      case 400:
      case 406:
      default:
        throw new EbinaApiError(res)
    }
  }

  // パスワードでログイン
  // { id, pass }
  // 200 ユーザーとトークン
  // 400 情報足らない
  // 401 パスワードが違う
  // 404 メンバーない
  // 405 パスワードが設定されてない
  public async login(body: { id: string, pass: string }) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/login', body)
    switch (res.status) {
      case 200:
        this.setTokens(res.data.tokens)
        return res.data.user
      case 400:
      case 401:
      case 404:
      case 405:
      default:
        throw new EbinaApiError(res)
    }
  }

  // ログアウト サーバー内のトークン消す
  // 200 消せた
  // 401 無かった
  public async logout() {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/logout')
    switch (res.status) {
      case 200:
        this.setTokens(null)
        return
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // 登録オプション取得
  // origin:
  // 200 オプション
  // 400 オリジンヘッダない
  // 404 メンバーがない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnRegistOptions() {
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/regist')
    switch (res.status) {
      case 200:
        return res.data
      case 400:
      case 401:
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res)
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
  public async sendWebAuthnRegistCredential(credential: any, deviceName: string) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/webauthn/regist', { ...credential, deviceName })
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 404:
      case 409:
      case 410:
      case 500:
      default:
        throw new EbinaApiError(res)
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
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/verify', { params: { deviceNames } })
    switch (res.status) {
      case 200:
        return res.data
      case 400:
      case 401:
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res)
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
    this.checkURL()
    const res = await this.ax.post('/ebina/user/webauthn/verify', credential)
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 404:
      case 405:
      case 409:
      case 410:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // デバイスら情報取得
  // origin:
  // ?names
  // 200 空でも返す
  // 400 情報足りない
  // 500 WebAuthnの設定おかしい
  public async getWebAuthnDeviceNames() {
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/device')
    switch (res.status) {
      case 200:
        return res.data
      case 400:
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res)
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
    this.checkURL()
    const res = await this.ax.delete(`/ebina/user/webauthn/device/${deviceName}`)
    switch (res.status) {
      case 200:
        return
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // メンバー配列取得 ID無いなら全部
  // ?ids
  // 200 空でも返す
  public async getUsers() {
    this.checkURL()
    const res = await this.ax.get('/ebina/user')
    switch (res.status) {
      case 200:
        return res.data
      default:
        throw new EbinaApiError(res)
    }
  }

  // メンバー配列削除
  // ?ids
  // 200 全部できた
  // 206 一部できた
  // 404 全部できない
  public async deleteUsers(ids: string[]) {
    this.checkURL()
    const res = await this.ax.delete('/ebina/user', { params: { ids: ids } })
    switch (res.status) {
      case 200:
      case 206:
        return
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res)
    }
  }

  // Apps

  // アプリ配列取得
  // 200 名前ら
  public async getAppNames() {
    this.checkURL()
    const res = await this.ax.get('/ebina/app')
    switch (res.status) {
      case 200:
        return res.data as string[]
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // アプリ作成
  // 200 OK
  // 400 情報足らない
  public async createApp(name: string) {
    this.checkURL()
    const res = await this.ax.post(`/ebina/app/${name}`)
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // アプリ削除 ゴミ箱に移動
  // 200 OK
  // 404 アプリない
  // 500 フォルダ移動ミスった
  public async deleteApp(name: string) {
    this.checkURL()
    const res = await this.ax.delete(`/ebina/app/${name}`)
    switch (res.status) {
      case 200:
        return
      case 401:
      case 404:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API

  // API起動状態取得
  // 200 { status: 'started' | 'stop', started_at: number }
  public async getAPIStatus(appName: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/api/status`)
    switch (res.status) {
      case 200:
        return res.data as { status: 'started' | 'stop', started_at: number }
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API起動状態更新
  // { status: 'start' | 'stop' }
  // 200 できた
  // 400 情報おかしい
  // 500 起動できなかった
  public async updateAPIStatus(appName: string, status: 'start' | 'stop') {
    this.checkURL()
    const res = await this.ax.put(`/ebina/app/${appName}/api/status`, { status })
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API一覧取得
  // 200 { path, api }
  public async getAPIs(appName: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/api/endpoint`)
    switch (res.status) {
      case 200:
        return res.data as { path: string, api: any }[]
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API作成
  // :path
  // { name, method, type, value }
  // 200 OK
  // 400 情報おかしい
  public async createPath(appName: string, path: string, api: TypeApi) {
    this.checkURL()
    const res = await this.ax.post(`/ebina/app/${appName}/api/endpoint/${path}`, api)
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API取得
  // :path
  // 200 API
  // 400 情報おかしい
  // 404 ない
  public async getAPI(appName: string, path: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/api/endpoint/${path}`)
    switch (res.status) {
      case 200:
        return res.data as TypeApi
      case 400:
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API更新
  // :path
  // 200 OK
  // 400 情報おかしい
  public async updateAPI(appName: string, path: string, api: any) {
    this.checkURL()
    const res = await this.ax.put(`/ebina/app/${appName}/api/endpoint/${path}`, api)
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // API削除
  // 200 OK
  // 400 情報おかしい
  // 404 パスない
  public async deleteAPI(appName: string, path: string) {
    this.checkURL()
    const res = await this.ax.delete(`/ebina/app/${appName}/api/endpoint/${path}`)
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 404:
      default:
        throw new EbinaApiError(res)
    }
  }

  // ポート取得
  // 200 { port: number }
  public async getPort(appName: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/api/port`)
    switch (res.status) {
      case 200:
        return res.data.port as number
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // ポート設定
  // { port: number }
  // 200 OK
  // 400 情報おかしい
  public async updatePort(appName: string, port: number) {
    this.checkURL()
    const res = await this.ax.put(`/ebina/app/${appName}/api/port`, { port })
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      default:
        throw new EbinaApiError(res)
    }
  }

  // JS

  // JSファイル作成
  // :path
  // {}: string?
  // 200 OK
  // 400 情報おかしい
  // 409 もうある
  // 500 ファイル関係ミスった
  public async createJS(appName: string, path: string, data: string | undefined = undefined) {
    this.checkURL()
    const res = await this.ax.post(`/ebina/app/${appName}/js/${path}`, data, { headers: { 'content-type': 'text/plain' } })
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 409:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // JSファイル一覧取得
  // 200 一覧
  // 500 ファイル読めなかった
  public async getJSList(appName: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/js`)
    switch (res.status) {
      case 200:
        return res.data as string[]
      case 401:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // JSファイル取得
  // :path
  // 200 text
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async getJS(appName: string, path: string) {
    this.checkURL()
    const res = await this.ax.get(`/ebina/app/${appName}/js/${path}`)
    switch (res.status) {
      case 200:
        return res.data as string
      case 400:
      case 401:
      case 404:
      case 409:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // JSファイル更新
  // :path
  // 200 OK
  // 400 情報おかしい
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async updateJS(appName: string, path: string, data: string) {
    this.checkURL()
    const res = await this.ax.patch(`/ebina/app/${appName}/js/${path}`, data, { headers: { 'content-type': 'text/plain' } })
    switch (res.status) {
      case 200:
        return
      case 400:
      case 401:
      case 409:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }

  // JSファイル削除
  // :path
  // 200 OK
  // 404 ファイルない
  // 409 ディレクトリ
  // 500 ファイル関係ミスった
  public async deleteJS(appName: string, path: string) {
    this.checkURL()
    const res = await this.ax.delete(`/ebina/app/${appName}/js/${path}`)
    switch (res.status) {
      case 200:
        return
      case 401:
      case 404:
      case 409:
      case 500:
      default:
        throw new EbinaApiError(res)
    }
  }
}

export default new EbinaAPI()

import axios, { AxiosInstance } from "axios";
import * as LS from './localstorageDelegate';

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

  public userRegist(user: any) {
    this.checkURL()
    return this.ax.post('/ebina/user/regist', user)
  }

  public async login(id: string, pass: string) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/login', { id, pass })
    if (res.status === 200) {
      this.setTokens(res.data.tokens)
    }
    return res
  }

  public async getWebAuthnRegistOptions() {
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/regist')
    return res
  }

  public async sendWebAuthnRegistCredential(credential: any, deviceName: string) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/webauthn/regist', { ...credential, deviceName })
    return res
  }

  public async getWebAuthnVerifyOptions(deviceNames?: string[]) {
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/verify', { params: { deviceNames } })
    return res
  }

  public async sendWebAuthnVerifyCredential(credential: any) {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/webauthn/verify', credential)
    return res
  }

  public async getWebAuthnDeviceNames() {
    this.checkURL()
    const res = await this.ax.get('/ebina/user/webauthn/devices')
    return res
  }

  public async deleteWebAuthnDevice(deviceName: string) {
    this.checkURL()
    const res = await this.ax.delete(`/ebina/user/webauthn/device/${deviceName}`)
    return res
  }

  public async logout() {
    this.checkURL()
    const res = await this.ax.post('/ebina/user/logout')
    if (res.status === 200) {
      this.setTokens(null)
    }
    return res
  }

  // Users

  public getUsers() {
    this.checkURL()
    return this.ax.get('/ebina/users/users')
  }

  public deleteUsers(ids: string[]) {
    this.checkURL()
    return this.ax.delete('/ebina/users/users', { params: { ids: ids.join() } })
  }

  // API

  public getAPIStatus() {
    this.checkURL()
    return this.ax.get('/ebina/api/status')
  }

  public startAPI() {
    this.checkURL()
    return this.ax.post('/ebina/api/start')
  }

  public stopAPI() {
    this.checkURL()
    return this.ax.post('/ebina/api/stop')
  }

  public getAPIs() {
    this.checkURL()
    return this.ax.get('/ebina/api/apis')
  }

  public createPath(api: any) {
    this.checkURL()
    return this.ax.post('/ebina/api/path', api)
  }

  public getPath(path: string) {
    this.checkURL()
    return this.ax.get('/ebina/api/api', { params: { path } })
  }

  public updatePath(api: any) {
    this.checkURL()
    return this.ax.put('/ebina/api/path', api)
  }

  public deletePath(path: string) {
    this.checkURL()
    return this.ax.delete('/ebina/api/path', { params: { path } })
  }

  // Edit

  public createJS(path: string, data: string | undefined = undefined) {
    this.checkURL()
    return this.ax.post('/ebina/edit/js/' + path, data, { headers: { 'content-type': 'text/plain' } })
  }

  public getJSList() {
    this.checkURL()
    return this.ax.get('/ebina/edit/js')
  }

  public getJS(path: string) {
    this.checkURL()
    return this.ax.get('/ebina/edit/js/' + path)
  }

  public updateJS(path: string, data: string) {
    this.checkURL()
    return this.ax.patch('/ebina/edit/js/' + path, data, { headers: { 'content-type': 'text/plain' } })
  }

  public deleteJS(path: string) {
    this.checkURL()
    return this.ax.delete('/ebina/edit/js/' + path)
  }
}

export default new EbinaAPI()

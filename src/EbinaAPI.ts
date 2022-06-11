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

  // Apps

  public getAppNames() {
    this.checkURL()
    return this.ax.get('/ebina/apps')
  }

  public createApp(name: string) {
    this.checkURL()
    return this.ax.post(`/ebina/app/${name}`)
  }

  public deleteApp(name: string) {
    this.checkURL()
    return this.ax.delete(`/ebina/app/${name}`)
  }

  // API

  public getAPIStatus(appName: string) {
    this.checkURL()
    return this.ax.get(`/ebina/app/${appName}/api/status`)
  }

  public startAPI(appName: string) {
    this.checkURL()
    return this.ax.post(`/ebina/app/${appName}/api/start`)
  }

  public stopAPI(appName: string) {
    this.checkURL()
    return this.ax.post(`/ebina/app/${appName}/api/stop`)
  }

  public getAPIs(appName: string) {
    this.checkURL()
    return this.ax.get(`/ebina/app/${appName}/api/apis`)
  }

  public createPath(appName: string, api: any) {
    this.checkURL()
    return this.ax.post(`/ebina/app/${appName}/api/path`, api)
  }

  public getAPI(appName: string, name: string) {
    this.checkURL()
    return this.ax.get(`/ebina/app/${appName}/api/api`, { params: { name } })
  }

  public updateAPI(appName: string, api: any) {
    this.checkURL()
    return this.ax.put(`/ebina/app/${appName}/api/path`, api)
  }

  public deleteAPI(appName: string, name: string) {
    this.checkURL()
    return this.ax.delete(`/ebina/app/${appName}/api/path`, { params: { name } })
  }

  // Edit

  public createJS(appName: string, path: string, data: string | undefined = undefined) {
    this.checkURL()
    return this.ax.post(`/ebina/app/${appName}/edit/js/${path}`, data, { headers: { 'content-type': 'text/plain' } })
  }

  public getJSList(appName: string) {
    this.checkURL()
    return this.ax.get(`/ebina/app/${appName}/edit/js`)
  }

  public getJS(appName: string, path: string) {
    this.checkURL()
    return this.ax.get(`/ebina/app/${appName}/edit/js/${path}`)
  }

  public updateJS(appName: string, path: string, data: string) {
    this.checkURL()
    return this.ax.patch(`/ebina/app/${appName}/edit/js/${path}`, data, { headers: { 'content-type': 'text/plain' } })
  }

  public deleteJS(appName: string, path: string) {
    this.checkURL()
    return this.ax.delete(`/ebina/app/${appName}/edit/js/${path}`)
  }
}

export default new EbinaAPI()

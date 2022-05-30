import axios, { AxiosInstance } from "axios";
import * as LS from './localstorageDelegate';

class EbinaAPI {
  private url: URL | null = null
  private ax!: AxiosInstance

  constructor() {
    this.setURL(LS.get(LS.ITEM.Server))
  }

  private setURL(url: string | null) {
    if (url) this.url = new URL(url)
    this.ax = axios.create({
      baseURL: this.url ? this.url.origin : undefined,
      withCredentials: true,
    })
  }

  public updateURL(url: string | null) {
    this.setURL(url)
    LS.set(LS.ITEM.Server, url)
  }

  // User

  public userRegist(user: any) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/user/regist', user)
  }

  public login(id: string, pass: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/user/login', { id, pass })
  }

  public logout() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/user/logout')
  }

  // Users

  public getUsers() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/users/users')
  }

  public deleteUsers(ids: string[]) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.delete('/ebina/users/users', { params: { ids: ids.join() } })
  }

  // API

  public getAPIStatus() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/api/status')
  }

  public startAPI() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/api/start')
  }

  public stopAPI() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/api/stop')
  }

  public getAPIs() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/api/apis')
  }

  public createPath(api: any) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/api/path', api)
  }

  public getPath(path: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/api/api', { params: { path } })
  }

  public updatePath(api: any) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.put('/ebina/api/path', api)
  }

  public deletePath(path: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.delete('/ebina/api/path', { params: { path } })
  }

  // Edit

  public createJS(path: string, data: string | undefined = undefined) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.post('/ebina/edit/js/' + path, data, { headers: { 'content-type': 'text/plain' } })
  }

  public getJSList() {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/edit/js')
  }

  public getJS(path: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.get('/ebina/edit/js/' + path)
  }

  public updateJS(path: string, data: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.patch('/ebina/edit/js/' + path, data, { headers: { 'content-type': 'text/plain' } })
  }

  public deleteJS(path: string) {
    if (!this.url) throw Error('URL did not set')
    return this.ax.delete('/ebina/edit/js/' + path)
  }
}

export default new EbinaAPI()

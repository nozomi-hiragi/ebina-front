const pEbina = "/ebina";
const pEbinaI = pEbina + "/i";
const pEbinaApp = pEbina + "/app";
const pEbinaMember = pEbina + "/member";
const pEbinaDatabase = pEbina + "/database";
const pEbinaRouting = pEbina + "/routing";
const pEbinaSettings = pEbina + "/settings";
const pEbinaILogin = pEbinaI + "/login";
const pEbinaIWebauthn = pEbinaI + "/webauthn";
const pEbinaIWebauthnDevice = pEbinaIWebauthn + "/device";
const pEbinaDatabaseUser = pEbinaDatabase + "/user";
const pApi = "/api";
const pApiEndpoint = pApi + "/endpoint";
const pScript = "/script";
const pCron = "/cron";

export const PathBuilder = {
  i: {
    path: pEbinaI,
    login: {
      path: pEbinaILogin,
      verify: pEbinaILogin + "/verify",
      option: pEbinaILogin + "/option",
    },
    loginWith: (id: string) => `${pEbinaILogin}/${id}`,
    logout: pEbinaI + "/logout",
    password: pEbinaI + "/password",
    webauthn: {
      regist: pEbinaIWebauthn + "/regist",
      verify: pEbinaIWebauthn + "/verify",
      device: pEbinaIWebauthnDevice,
      deviceWith: (device: string) => ({
        path: `${pEbinaIWebauthnDevice}/${device}`,
        enable: `${pEbinaIWebauthnDevice}/${device}/enable`,
        disable: `${pEbinaIWebauthnDevice}/${device}/disable`,
      }),
    },
  },

  member: {
    path: pEbinaMember,
    regist: {
      option: `${pEbinaMember}/regist/option`,
      verify: `${pEbinaMember}/regist/verify`,
    },
  },

  app: pEbinaApp,
  appWith: (app: string) => ({
    path: `${pEbinaApp}/${app}`,
    api: {
      status: `${pEbinaApp}/${app}${pApi}/status`,
      port: `${pEbinaApp}/${app}${pApi}/port`,
      endpoint: `${pEbinaApp}/${app}${pApiEndpoint}`,
      endpointWith: (ep: string) => `${pEbinaApp}/${app}${pApiEndpoint}/${ep}`,
    },
    script: `${pEbinaApp}/${app}${pScript}`,
    scriptWith: (path: string) => `${pEbinaApp}/${app}${pScript}/${path}`,
    cron: `${pEbinaApp}/${app}${pCron}`,
    cronWith: (name: string) => `${pEbinaApp}/${app}${pCron}/${name}`,
  }),

  database: {
    path: pEbinaDatabase,
    user: pEbinaDatabaseUser,
    userWith: (name: string) => `${pEbinaDatabaseUser}/${name}`,
  },
  databaseWith: (db: string) => ({
    path: `${pEbinaDatabase}/${db}`,
    collection: (collection: string) => ({
      path: `${pEbinaDatabase}/${db}/${collection}`,
      find: `${pEbinaDatabase}/${db}/${collection}/find`,
    }),
  }),

  routing: {
    path: pEbinaRouting,
    route: (name: string) => `${pEbinaRouting}/route/${name}`,
    status: `${pEbinaRouting}/status`,
  },

  settings: {
    path: pEbinaSettings,
    mongodb: pEbinaSettings + "/mongodb",
    webauthn: pEbinaSettings + "/webauthn",
  },
};

export default PathBuilder;

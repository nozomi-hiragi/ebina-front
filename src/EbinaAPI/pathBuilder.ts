const pEbina = "/ebina";
const pEbinaI = pEbina + "/i";
const pEbinaApp = pEbina + "/app";
const pEbinaMember = pEbina + "/member";
const pEbinaDatabase = pEbina + "/database";
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
    login: pEbinaILogin,
    loginWith: (id: string) => `${pEbinaILogin}/${id}`,
    logout: pEbinaI + "/logout",
    refresh: pEbinaI + "/refresh",
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

  member: pEbinaMember,

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

  settings: {
    path: pEbinaSettings,
    mongodb: pEbinaSettings + "/mongodb",
  },
};

export default PathBuilder;

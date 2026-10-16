// WebAuthn 関連のデータ変換ヘルパー（Base64URL と WebAuthn オブジェクトの相互変換）

export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: string;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface PublicKeyCredentialUserEntityJSON {
  id: string;
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialDescriptorJSON {
  id: string;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
}

export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    clientDataJSON: string;
    attestationObject: string;
    authenticatorData?: string;
    publicKey?: string;
    publicKeyAlgorithm?: number;
    transports?: AuthenticatorTransport[];
  };
  clientExtensionResults: Record<string, unknown>;
  authenticatorAttachment?: string | null;
}

export function base64urlToBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// サーバーから取得した JSON オプションを navigator.credentials.create 用のオブジェクトに変換
export function parseCreationOptionsFromJSON(
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  if (typeof (PublicKeyCredential as unknown as { parseCreationOptionsFromJSON?: (opts: unknown) => PublicKeyCredentialCreationOptions }).parseCreationOptionsFromJSON === "function") {
    return (PublicKeyCredential as unknown as { parseCreationOptionsFromJSON: (opts: unknown) => PublicKeyCredentialCreationOptions }).parseCreationOptionsFromJSON(optionsJSON);
  }

  return {
    ...optionsJSON,
    challenge: base64urlToBytes(optionsJSON.challenge),
    user: {
      ...optionsJSON.user,
      id: base64urlToBytes(optionsJSON.user.id),
    },
    excludeCredentials: optionsJSON.excludeCredentials?.map((cred) => ({
      ...cred,
      id: base64urlToBytes(cred.id),
    })),
  };
}

// 作成された PublicKeyCredential をサーバー送信用 JSON に変換（publicKey 等の付与を保証）
export function registrationResponseToJSON(
  credential: PublicKeyCredential,
): RegistrationResponseJSON {
  const attestation = credential.response as AuthenticatorAttestationResponse;
  const spki = typeof attestation.getPublicKey === "function" ? attestation.getPublicKey() : null;
  const spkiBase64url = spki ? bytesToBase64url(spki) : undefined;

  let result: RegistrationResponseJSON;
  if (typeof credential.toJSON === "function") {
    result = credential.toJSON() as RegistrationResponseJSON;
  } else {
    result = {
      id: credential.id,
      rawId: bytesToBase64url(credential.rawId),
      type: "public-key",
      response: {
        clientDataJSON: bytesToBase64url(attestation.clientDataJSON),
        attestationObject: bytesToBase64url(attestation.attestationObject),
      },
      clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
      authenticatorAttachment: credential.authenticatorAttachment,
    };
  }

  if (typeof attestation.getAuthenticatorData === "function" && !result.response.authenticatorData) {
    const authData = attestation.getAuthenticatorData();
    if (authData) {
      result.response.authenticatorData = bytesToBase64url(authData);
    }
  }
  if (typeof attestation.getPublicKeyAlgorithm === "function" && result.response.publicKeyAlgorithm === undefined) {
    result.response.publicKeyAlgorithm = attestation.getPublicKeyAlgorithm();
  }
  if (typeof attestation.getTransports === "function" && !result.response.transports) {
    result.response.transports = attestation.getTransports() as AuthenticatorTransport[];
  }
  if (spkiBase64url && !result.response.publicKey) {
    result.response.publicKey = spkiBase64url;
  }

  return result;
}

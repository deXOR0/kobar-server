import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions } from 'jose';
import { URL } from 'url';

import type { JWTHeaderParameters, JWTPayload } from 'jose';
import type { Socket } from 'socket.io';
import { ConsoleLogger } from '@nestjs/common';

declare module 'socket.io' {
    interface Socket {
        auth?: { user: JWTPayload; header: JWTHeaderParameters };
    }
}

type SocketIOMiddlewareFactory = (
    domain?: string,
    audience?: string,
) => (socket: Socket) => void;

const auth0Middleware: SocketIOMiddlewareFactory = (
    domainParam: string,
    audienceParam: string,
) => {
    const domain = domainParam;
    const audience = audienceParam;

    if (!domain) {
        throw new Error(
            'Config error: Auth0 domain not found, did you pass the domain parameter or set AUTH0_DOMAIN ?',
        );
    }

    return async function (socket) {
        const { token: authHandshakeToken } = socket.handshake.auth;

        if (typeof authHandshakeToken !== 'string') {
            console.error(
                new Error(
                    'No Authorization handshake information found, io({ auth: {token: "Bearer [token]" } }); https://socket.io/docs/v3/middlewares/#sending-credentials ',
                ),
            );
            return;
        }

        const authHandshakeTokenSplitted = authHandshakeToken.split(' ');

        if (
            authHandshakeTokenSplitted.length !== 2 ||
            authHandshakeTokenSplitted[0] !== 'Bearer'
        ) {
            console.error(
                new Error(
                    'Malformed Authorization handshake, should be: token: "Bearer [token]"',
                ),
            );
            return;
        }

        const jwt = authHandshakeTokenSplitted[1];

        try {
            const JWKS = createRemoteJWKSet(
                new URL(`https://${domain}/.well-known/jwks.json`),
            );

            const config: JWTVerifyOptions = { issuer: `https://${domain}/` };

            if (audience !== undefined) {
                config.audience = audience;
            }

            const { payload, protectedHeader } = await jwtVerify(
                jwt,
                JWKS,
                config,
            );

            socket.auth = { user: payload, header: protectedHeader };
        } catch (err) {
            console.error(err);
            // console.error(
            //     new Error('Failed to verify claims, user not authorized'),
            // );
            return;
        }

        return socket;
    };
};

export default auth0Middleware;

jest.mock('cross-fetch');

var util = require('../util/util');
var factory = require('../util/factory');
var packageJson = require('../../package.json');
var AuthSdkError  = require('../../lib/errors/AuthSdkError');
var OktaAuth = require('../../lib/browser/browserIndex');
var http = require('../../lib/http');

describe('pkce', function() {

  describe('getToken', function() {
    var ISSUER = 'http://example.okta.com';
    var REDIRECT_URI = 'http://fake.local';
    var CLIENT_ID = 'fake';
    var endpoint = '/oauth2/v1/token';
    var codeVerifier = 'superfake';
    var authorizationCode = 'notreal';
    var grantType = 'authorization_code';

    util.itMakesCorrectRequestResponse({
      title: 'requests a token',
      setup: {
        uri: ISSUER,
        bypassCrypto: true,
        calls: [
          {
            request: {
              method: 'post',
              uri: endpoint,
              withCredentials: false,
              data: {
                client_id: CLIENT_ID,
                grant_type: grantType,
                redirect_uri: REDIRECT_URI
              },
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Okta-User-Agent-Extended': 'okta-auth-js-' + packageJson.version
              }
            },
            response: 'pkce-token-success',
            responseVars: {
              scope: 'also fake',
              accessToken: 'fake access token',
              idToken: factory.buildIDToken({
                issuer: ISSUER,
                clientId: CLIENT_ID
              })
            }
          }
        ]
      },
      execute: function (test) {
        return test.oa.pkce.getToken({
          clientId: CLIENT_ID,
          redirectUri: REDIRECT_URI,
          authorizationCode: authorizationCode,
          codeVerifier: codeVerifier,
          grantType: grantType,
        }, {
          tokenUrl: ISSUER + endpoint
        });
      }
    });

    describe('validateOptions', function() {
      var authClient;
      var oauthOptions;

      beforeEach(function() {
        authClient = new OktaAuth({
          url: 'https://auth-js-test.okta.com'
        });

        oauthOptions = {
          clientId: CLIENT_ID,
          redirectUri: REDIRECT_URI,
          authorizationCode: authorizationCode,
          codeVerifier: codeVerifier,
          grantType: grantType,
        };
      });

      it('Does not throw if options are valid', function() {
        var httpRequst = jest.spyOn(http, 'httpRequest').mockImplementation();
        var urls = {
          tokenUrl: 'http://superfake'
        };
        authClient.pkce.getToken(oauthOptions, urls);
        expect(httpRequst).toHaveBeenCalled();
      });
  
      it('Throws if no clientId', function() {
        oauthOptions.clientId = undefined;
        try {
          authClient.pkce.getToken(oauthOptions);
        } catch(e) {
          expect(e instanceof AuthSdkError).toBe(true);
          expect(e.message).toBe('A clientId must be specified in the OktaAuth constructor to get a token');
        }
      });

      it('Throws if no redirectUri', function() {
        oauthOptions.redirectUri = undefined;
        try {
          authClient.pkce.getToken(oauthOptions);
        } catch(e) {
          expect(e instanceof AuthSdkError).toBe(true);
          expect(e.message).toBe('The redirectUri passed to /authorize must also be passed to /token');
        }
      });

      it('Throws if no authorizationCode', function() {
        oauthOptions.authorizationCode = undefined;
        try {
          authClient.pkce.getToken(oauthOptions);
        } catch(e) {
          expect(e instanceof AuthSdkError).toBe(true);
          expect(e.message).toBe('An authorization code (returned from /authorize) must be passed to /token');
        }
      });

      it('Throws if no codeVerifier', function() {
        oauthOptions.codeVerifier = undefined;
        try {
          authClient.pkce.getToken(oauthOptions);
        } catch(e) {
          expect(e instanceof AuthSdkError).toBe(true);
          expect(e.message).toBe('The "codeVerifier" (generated and saved by your app) must be passed to /token');
        }
      });

      it('Throws if grantType is not "authorization_code', function() {
        oauthOptions.grantType = 'implicit';
        try {
          authClient.pkce.getToken(oauthOptions);
        } catch(e) {
          expect(e instanceof AuthSdkError).toBe(true);
          expect(e.message).toBe('Expecting "grantType" to equal "authorization_code"');
        }
      });
    });
  });

});
import dotenv from "dotenv";
import fs from "fs";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: true,
    ca: `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUZO8TlIoLwblRh2DsExsaVIAK/e4wDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1MWZkYmE5NzQtNmViZC00ZGFlLWIwNzUtMWUzMjdhN2Jm
N2NiIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNjIyMDcwNTA0WhcNMzUwNjIwMDcw
NTA0WjBAMT4wPAYDVQQDDDUxZmRiYTk3NC02ZWJkLTRkYWUtYjA3NS0xZTMyN2E3
YmY3Y2IgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAPKfFWVlilH3IvUtVMfoy05/fjAwhRoNdwO613ges8Xbk0+jdhnvqqDg
0vbcSqZjvYFhTJ1ZQuNibEsN+DxEOhcEKGDmcGZerpGxeFkKebLNWULxbw9VgkMu
afgsMzyPNNbP1cl1uVxzXbSbe70Yg9DWMSCq7ZtjRFCXcFVOZJGW8i6a8nqJdsGu
Y3DrqwUzUGvhhJ6LSiR4EyP9roVC5Dk8+5ZLDM43rNUW7LgG9CFr64GB0xhmBBW4
t1RINYt6Qa60lCxDzhrphLEXwNrM570rjH8brNMEjHSeYq32BkI10F0PLfKlugkF
wt/35gwi09pWhix3/GhwAmcnnAk4PZUxEJCKi5ynXNS9GWCiaVKUYqsRoeuKHkV3
wpGrxxLT90s95FrRixlO8VMXozIT9lRzWIOcnHBHUSNCn9I6yCK3eX5btNP1fZcV
tMDZ60KpvjrDUnj4K/fGOE9mBpk8DR7gmmhuZGRMhagXCvg6Z+hZDgu4HdF49e/i
Q4fy4IX6xQIDAQABo0IwQDAdBgNVHQ4EFgQUm0uFvWnjC/bLH49I+ClXiBQYF5cw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAMTWKnC+IJ2Cx5nvaipV3IXYEgQPH83yVFkst5vSb4iei/9e3dd+NjLNuOgD
gxVGD8GaSdHeMfb1UZvhnwJ8SSQ1oECION0zKhjOTxAds6elBU2e2LFio78vePQb
561+GOqzQ1fDWQrss16+PDLg4R5yFKWl8Q0x//HCA9NPcR6OSmGYI1p34rGnVLbn
9cb9lKCVw9pobpaGAuYqZ/feubn7oz+H+Jf7AqiZG13/V2UjAMuSz5Pyj8vdZ7TY
CvuTRVHlnwjxy6Xg8R/vaSBMN9D2uSZ4Q0lRSXyMl3SeSKCIpDWFwbdSknDiSpTt
lkDCNVfRZHGEm6YWlfqH6GS7phXvl4/SshATyVwh2hbIQltgdNr5uhRO5HFhmh7B
+85BNxXHYNgK274sYZaiDoKZjukRCRw8A/aOmIOpLoKCDwEggh1sxTL2W0S6gSqM
bX4KMtUYLmPMNLiLDHkrZIXb1bBMYIMARZsZq5XORlJ79HC2alb6oFDgq+7TEbZ5
jI9+TQ==
-----END CERTIFICATE-----`,
  },
});

export default {
  query: (text, params) => pool.query(text, params),
};

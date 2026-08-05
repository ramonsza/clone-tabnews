import { PageLayout, Header, Text } from "@primer/react";
import Head from "next/head";

export default function DefaultLayout({ children, metadata = {} }) {
  return (
    <>
      <Head>
        <title>{metadata.title ? `${metadata.title} · RSZA` : "RSZA"}</title>
        {metadata.description && (
          <meta name="description" content={`${metadata.description}`} />
        )}
      </Head>
      <Header>
        <Header.Item full>
          <Header.Link href="/">RSZA</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/login">Login</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/cadastro">Cadastrar</Header.Link>
        </Header.Item>
      </Header>
      <PageLayout>
        <PageLayout.Content>{children}</PageLayout.Content>
        <PageLayout.Footer divider={"line"}>
          <Text size="small">© {new Date().getFullYear().toString()} RSZA</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}

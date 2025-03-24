import { getTranslations } from "next-intl/server"

import NewGameBtn from "@/components/NewGameBtn"
import Button from "@/components/Button"

export default async function Home() {
  const t = await getTranslations()
  return (
    <main className="main-content">
      <section className="intro">
        <h1 className="home-title">
          {t("Pages.Home.title")}
        </h1>
        <div className="home-actions">
          <NewGameBtn />
          <Button href={{ pathname: "/tutorial" }}>
            {t("Labels.tutorial")}
          </Button>
        </div>
      </section>
    </main>
  );
}

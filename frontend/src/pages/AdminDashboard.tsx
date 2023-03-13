//Resources
import { Link, useHistory } from "react-router-dom";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

import { TwoColumnLayout } from "../components/Layouts";
import { AuthContext } from "../providers/AuthProvider";
import { userPurge } from "../api/user";
import { ToastContext } from "../providers/ToastProvider";
import ChainsList from "../components/ChainsList";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { authUser } = useContext(AuthContext);
  const { addModal } = useContext(ToastContext);
  const history = useHistory();

  function deleteClicked() {
    addModal({
      message: t("deleteAccount"),
      actions: [
        {
          text: t("delete"),
          type: "error",
          fn: () => {
            userPurge(authUser!.uid);
            history.push("/users/logout");
          },
        },
      ],
    });
  }

  if (!authUser) return null;

  const isChainAdmin = useMemo(
    () => !!authUser?.chains.find((uc) => uc.is_chain_admin),
    [authUser]
  );

  return (
    <>
      <Helmet>
        <title>The Clothing Loop | Account</title>
        <meta name="description" content="Account" />z
      </Helmet>
      <main className="">
        <section className="bg-teal-light mb-6">
          <div className="container mx-auto flex items-stretch justify-between px-5 md:px-20">
            <div className="flex flex-col items-between py-8">
              <div className="flex-grow max-w-screen-xs">
                <h1 className="font-serif font-bold text-4xl text-secondary mb-3">
                  {t("helloN", { n: authUser.name })}
                </h1>
                <p className="mb-6">
                  {t("thankYouForBeingHere")}
                  <br />
                  <br />
                  {t("goToTheToolkitFolder")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap">
                {authUser.is_root_admin || isChainAdmin ? (
                  <Link
                    className="btn btn-primary h-auto mb-4 sm:mr-4 text-black"
                    target="_blank"
                    to={{
                      pathname:
                        "https://drive.google.com/drive/folders/1iMJzIcBxgApKx89hcaHhhuP5YAs_Yb27",
                    }}
                  >
                    {t("toolkitFolder")}
                    <span className="feather feather-external-link ml-2"></span>
                  </Link>
                ) : null}

                <Link
                  className="btn btn-secondary btn-outline bg-white mb-4 sm:mr-4"
                  to="/users/me/edit"
                >
                  {t("editAccount")}
                  <span className="feather feather-edit ml-2"></span>
                </Link>

                <button
                  className="btn btn-error btn-outline bg-white mb-4 sm:mr-4"
                  onClick={deleteClicked}
                >
                  <span className="text-black">{t("deleteUserBtn")}</span>
                  <span className="feather feather-alert-octagon ml-2"></span>
                </button>
              </div>
            </div>
            <img
              className="hidden lg:block h-64 w-64 my-6 rounded-full object-cover self-center"
              src="https://images.clothingloop.org/256x256/denise.jpg"
            />
          </div>
        </section>
        <ChainsList />
      </main>
    </>
  );
}

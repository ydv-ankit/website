import {
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonButton,
} from "@ionic/react";
import { logoGoogle, shield } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { SizeI18nKeys, User } from "../api";

export default function UserCard({
  user,
  isUserAdmin,
}: {
  user: User;
  isUserAdmin: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="ion-padding">
        <IonText>
          <h1 className="ion-no-margin">
            {user?.name}
            {isUserAdmin ? (
              <IonIcon icon={shield} className="ion-margin-start" />
            ) : null}
          </h1>
        </IonText>
      </div>
      <IonList>
        <IonItem lines="none">
          <IonLabel>
            <h3>{t("Interested Sizes")}</h3>
            <div className="ion-text-wrap">
              {user?.sizes.map((size) => (
                <IonBadge className="ion-margin-end" key={size}>
                  {SizeI18nKeys[size]}
                </IonBadge>
              ))}
            </div>
          </IonLabel>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>
            <h3>{t("Email")}</h3>
            {user?.email ? (
              <a href={"mailto:" + user.email}>{user.email}</a>
            ) : null}
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            <h3>{t("Phone number")}</h3>
            {user.phone_number ? (
              <a href={"tel:" + user.phone_number}>{user.phone_number}</a>
            ) : null}
          </IonLabel>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>
            <h3>{t("Address")}</h3>
            {/* https://www.google.com/maps/@${long},${lat},14z */}
            <p>{user?.address}</p>
          </IonLabel>
          {user.address ? (
            <IonButton
              slot="end"
              shape="round"
              size="small"
              rel="noreferrer"
              target="_blank"
              href={
                `https://www.google.com/maps/search/` +
                user.address.replaceAll(" ", "+")
              }
            >
              <IonIcon icon={logoGoogle} />
            </IonButton>
          ) : null}
        </IonItem>
      </IonList>
    </div>
  );
}

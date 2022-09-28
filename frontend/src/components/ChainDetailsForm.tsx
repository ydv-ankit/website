import { useState } from "react";
import * as Yup from "yup";
import destination from "@turf/destination";
import ReactMapGL, { SVGOverlay, FlyToInterpolator } from "react-map-gl";
import { useTranslation } from "react-i18next";
import { Form, Formik } from "formik";

import { Button, Typography, Alert, Grid } from "@mui/material";
import { makeStyles } from "@mui/styles";

// Project resources
import categories from "../util/categories";
import { IViewPort } from "../types";
import theme from "../util/theme";
import Geocoding from "../pages/Geocoding";
import { TextForm, NumberField, SelectField } from "./FormFields";
import PopoverOnHover from "./Popover";
import SizesDropdown from "../components/SizesDropdown";
import CategoriesDropdown from "../components/CategoriesDropdown";
import { Chain } from "../api/types";

//media
import RightArrow from "../images/right-arrow-white.svg";
import { RequestRegisterChain } from "../api/login";
import { Genders, Sizes } from "../api/enums";

const accessToken = process.env.REACT_APP_MAPBOX_KEY || "";

interface IProps {
  onSubmit: (values: RegisterChainForm) => void;
  submitted?: boolean;
  submitError?: string;
  initialValues?: RegisterChainForm;
}

export type RegisterChainForm = Omit<
  RequestRegisterChain,
  "address" | "open_to_new_members"
>;

const ChainDetailsForm = ({
  onSubmit,
  submitError,
  initialValues,
  submitted,
}: IProps) => {
  const classes = makeStyles(theme as any)();
  const { t } = useTranslation();

  const [viewport, setViewport] = useState<IViewPort>({
    longitude: initialValues ? initialValues.longitude : 0,
    latitude: initialValues ? initialValues.latitude : 0,
    width: "40vw",
    height: "40vh",
    zoom: initialValues ? 10 : 1,
  });

  const formSchema = Yup.object().shape({
    name: Yup.string().min(2, t("mustBeAtLeastChar")).required(t("required")),
    description: Yup.string(),
    radius: Yup.number().required(t("required")),
    genders: Yup.array().of(Yup.string()).required(t("required")),
    sizes: Yup.array().of(Yup.string()).required(t("required")),
    longitude: Yup.number(),
    latitude: Yup.number(),
  } as Record<keyof RegisterChainForm, any>);

  const flyToLocation = (longitude: number, latitude: number) => {
    setViewport({
      ...viewport,
      longitude: longitude,
      latitude: latitude,
      zoom: 10,
      transitionDuration: 500,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  const handleGeolocationResult = ({
    result: { center },
  }: {
    result: { center: [number, number] };
  }) => {
    flyToLocation(...center);
  };

  const getPlaceName = async (longitude: number, latitude: number) => {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&cachebuster=1618224066302&autocomplete=true&types=locality%2Cplace`
    );
    const data = await response.json();
    return data.features[0].place_name;
  };

  const onSubmitWrapper = async (values: any) => {
    values.address = await getPlaceName(values.longitude, values.latitude);
    return onSubmit(values);
  };

  const defaultValues: RegisterChainForm = {
    name: "",
    description: "",
    radius: 3,
    genders: [],
    sizes: [],
    longitude: 0,
    latitude: 0,
  };

  return (
    <Formik<RegisterChainForm>
      initialValues={Object.assign(defaultValues, initialValues)}
      validationSchema={formSchema}
      validateOnChange={false}
      validate={(values) => {
        if (values.longitude === 0 && values.latitude === 0) {
          return {
            longitude: t("pleaseSetTheLoopLocationByClick"),
          };
        }
      }}
      onSubmit={onSubmitWrapper}
    >
      {({ values, errors, touched, setFieldValue, handleChange }) => {
        const handleMapClick = (event: any) => {
          const targetClass = String(event.srcEvent.target?.className);
          if (targetClass.includes("mapboxgl-ctrl-geocoder")) {
            // ignore clicks on geocoding search bar, which is on top of map
            return;
          }
          setFieldValue("longitude", event.lngLat[0]);
          setFieldValue("latitude", event.lngLat[1]);
          flyToLocation(event.lngLat[0], event.lngLat[1]);
        };

        const redrawLoop = ({ project }: { project: any }) => {
          if (values.longitude === null || values.latitude === null) {
            return;
          }
          const [centerX, centerY] = project([
            values.longitude,
            values.latitude,
          ]);
          // get the coordinates of a point the right distance away from center
          const boundaryPoint = destination(
            [values.longitude, values.latitude],
            values.radius,
            0, // due north
            { units: "kilometers" }
          );
          const [_, boundaryY] = project(boundaryPoint.geometry.coordinates);
          const projectedRadius = centerY - boundaryY;

          return (
            <>
              <defs>
                <radialGradient id="feather">
                  <stop
                    offset="0%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="50%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>
              <circle
                cx={centerX}
                cy={centerY}
                r={projectedRadius}
                fill="url(#feather)"
              />
              ;
            </>
          );
        };

        const handleCategoriesChange = (selectedGenders: string[]) => {
          setFieldValue("genders", selectedGenders as Genders[]);
          // potentially remove some sizes if their parent category has been deselected
          const filteredSizes = (values.sizes || []).filter(
            (size) =>
              selectedGenders.filter((gender) =>
                categories[gender as Genders].includes(size as Sizes)
              ).length > 0
          );
          setFieldValue("sizes", filteredSizes);
        };

        return (
          <Grid container style={{ padding: "1% 2%" }}>
            <Grid item xs={12} sm={6}>
              <ReactMapGL
                mapboxApiAccessToken={accessToken}
                mapStyle="mapbox://styles/mapbox/light-v10"
                {...viewport}
                onViewportChange={(newView: IViewPort) => setViewport(newView)}
                onClick={handleMapClick}
                getCursor={() => "pointer"}
                className={classes.newLoopMap}
                width="100%"
              >
                <Geocoding
                  onResult={handleGeolocationResult}
                  className={classes.inMapSearchBar}
                />
                {values.longitude !== null && values.latitude !== null ? (
                  <SVGOverlay redraw={redrawLoop} />
                ) : null}
              </ReactMapGL>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Form noValidate>
                <Grid container style={{ paddingBottom: "5%" }}>
                  <Typography className="formSubtitle">
                    {t("clickToSetLoopLocation")}
                  </Typography>
                  <Grid item xs={12}>
                    <TextForm
                      required
                      label={t("loopName")}
                      name="name"
                      type="text"
                      value={values.name}
                      error={touched.name && Boolean(errors.name)}
                      helperText={
                        touched.name && errors.name ? errors.name : null
                      }
                      className={classes.textField}
                    />

                    <PopoverOnHover
                      message={t("upToYouUsuallyTheGeopraphic")}
                    />
                  </Grid>
                  <Grid item xs={3} style={{ paddingTop: "10px" }}>
                    <NumberField
                      required
                      label={t("radius")}
                      name="radius"
                      value={values.radius}
                      error={touched.radius && Boolean(errors.radius)}
                      helperText={
                        touched.radius && errors.radius ? errors.radius : null
                      }
                      className={classes.textField}
                      step={0.1}
                    />
                    <PopoverOnHover
                      message={t("decideOnTheAreaYourLoopWillBeActiveIn")}
                    />
                  </Grid>

                  <Grid item xs={12} style={{ position: "relative" }}>
                    <TextForm
                      label={t("description")}
                      name="description"
                      value={values.description}
                      error={touched.description && Boolean(errors.description)}
                      helperText={
                        touched.description && errors.description
                          ? errors.description
                          : null
                      }
                      className={classes.textField}
                    />
                    <PopoverOnHover message={t("optionalFieldTypeAnything")} />
                  </Grid>
                  <Grid item xs={12} style={{ position: "relative" }}>
                    <div style={{ paddingTop: "10px" }}>
                      <CategoriesDropdown
                        variant="standard"
                        showInputLabel
                        genders={values.genders || []}
                        handleSelectedCategoriesChange={handleCategoriesChange}
                      />
                    </div>
                    <div style={{ paddingTop: "10px", position: "relative" }}>
                      <SizesDropdown
                        variant="standard"
                        showInputLabel
                        label={t("sizes")}
                        genders={values.genders || []}
                        sizes={values.sizes || []}
                        handleSelectedCategoriesChange={(val) =>
                          setFieldValue("sizes", val)
                        }
                      />
                      <PopoverOnHover
                        message={t(
                          "mixedBagsUsuallyWorkBestThereforeWeRecommentTo"
                        )}
                      />
                    </div>
                  </Grid>
                  {touched.longitude && errors.longitude ? (
                    <Grid item xs={12}>
                      <Typography color="error">{errors.longitude}</Typography>
                    </Grid>
                  ) : null}
                </Grid>

                {submitError && <Alert severity="error">{submitError}</Alert>}
                {submitted && <Alert security="success">{t("saved")}</Alert>}
                <div className={classes.formSubmitActions}>
                  <Button type="submit" className={classes.buttonOutlined}>
                    {t("back")}
                  </Button>
                  <Button type="submit" className={classes.button}>
                    {t("submit")}
                    <img src={RightArrow} alt="" />
                  </Button>
                </div>
              </Form>
            </Grid>
          </Grid>
        );
      }}
    </Formik>
  );
};

export type { Chain };
export default ChainDetailsForm;

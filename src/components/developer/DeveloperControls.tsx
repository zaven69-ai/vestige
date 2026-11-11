import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Alert,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useSimulationController,
  useSimulationMode,
} from "../../lib/developer/DeveloperLocation";
import { SIMULATION_STEP_MS } from "../../lib/developer/simulation";
import { useLive } from "../../lib/live/LiveProvider";
import { cities } from "../../data/monuments";
import { vienneAntique } from "../../data/live/vienneAntique";
import type { Point } from "../../lib/game";
import { Button, s } from "../ui";
import { SimulationNotice } from "./SimulationBanner";
export function SimulationJoystick({
  active,
  mapHeading,
}: {
  active: boolean;
  mapHeading: number;
}) {
  const controller = useSimulationController();
  const [knob] = useState(() => new Animated.ValueXY());
  const reset = useMemo(
    () => () => {
      controller.stop();
      knob.setValue({ x: 0, y: 0 });
    },
    [controller, knob],
  );
  useEffect(() => {
    if (!active) reset();
    return reset;
  }, [active, reset]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => active,
        onMoveShouldSetPanResponder: () => active,
        onPanResponderTerminationRequest: () => true,
        onPanResponderGrant: () => {
          reset();
        },
        onPanResponderMove: (_event, gesture) => {
          if (!active) return;
          const scale = Math.max(1, Math.hypot(gesture.dx, gesture.dy) / 34);
          knob.setValue({ x: gesture.dx / scale, y: gesture.dy / scale });
          controller.setStick(gesture.dx / 34, -gesture.dy / 34, mapHeading);
        },
        onPanResponderRelease: reset,
        onPanResponderTerminate: reset,
      }),
    [active, controller, knob, reset, mapHeading],
  );
  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityLabel="Joystick de test : faites glisser pour déplacer Catia"
      style={{
        width: 108,
        height: 108,
        borderRadius: 54,
        borderWidth: 1,
        borderColor: "#D8BE80",
        backgroundColor: "#06152BE8",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0.4,
      }}
    >
      <Text
        style={{ position: "absolute", top: 5, color: "#D8BE80", fontSize: 10 }}
      >
        ↑
      </Text>
      <Animated.View
        pointerEvents="none"
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "#B18F50",
          borderWidth: 2,
          borderColor: "#F4DFAC",
          transform: knob.getTranslateTransform(),
        }}
      />
    </View>
  );
}
export function DeveloperControls({
  open,
  close,
  active,
  mapHeading,
  bottom,
  onTeleport,
  onReturnGPS,
}: {
  open: boolean;
  close: () => void;
  active: boolean;
  mapHeading: number;
  bottom: number;
  onTeleport: (point: Point) => void;
  onReturnGPS: () => void;
}) {
  const simulation = useSimulationMode(),
    live = useLive(),
    insets = useSafeAreaInsets();
  if (!__DEV__) return null;
  function enable() {
    Alert.alert(
      "Activer le GPS simulé ?",
      "Position de démonstration à Vienne, sans découverte, XP ni visite sauvegardée. Le GPS réel reste séparé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Activer",
          onPress: () => {
            simulation.controller.enable(cities.Vienne);
            onTeleport(cities.Vienne);
            close();
          },
        },
      ],
    );
  }
  const presets = [
    { title: "Centre de Vienne", point: cities.Vienne },
    ...vienneAntique.stops.map((stop, index) => ({
      title: [
        "Temple d’Auguste et de Livie",
        "Jardin archéologique de Cybèle",
        "Théâtre antique",
      ][index],
      point: stop.approach,
    })),
  ];
  return (
    <>
      {simulation.enabled && active && !open && (
        <View style={{ position: "absolute", bottom, left: 16 }}>
          <SimulationJoystick
            active={active && !open}
            mapHeading={mapHeading}
          />
        </View>
      )}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#0008",
          }}
        >
          <View
            style={{
              maxHeight: "85%",
              padding: 20,
              paddingBottom: Math.max(20, insets.bottom),
              backgroundColor: "#07152C",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <SimulationNotice />
              <Text style={s.heading}>Laboratoire de localisation</Text>
              <Text style={s.body}>
                Développement uniquement · aucune donnée de démonstration
                sauvegardée. Joystick à 1,4 m/s maximum, mises à jour toutes les{" "}
                {SIMULATION_STEP_MS} ms. L’appui long téléporte après
                confirmation.
              </Text>
              {!simulation.enabled ? (
                <Button
                  title="Activer le mode test à Vienne"
                  onPress={enable}
                />
              ) : (
                <>
                  <Button
                    title="Tester Vienne antique"
                    disabled={!live.ready}
                    onPress={() => {
                      live.begin(vienneAntique.id);
                      close();
                    }}
                  />
                  {presets.map(({ title, point }) => (
                    <Button
                      key={title}
                      secondary
                      title={`Téléporter · ${title}`}
                      onPress={() => {
                        if (simulation.controller.teleportTo(point)) {
                          onTeleport(point);
                          close();
                        }
                      }}
                    />
                  ))}
                  <Button
                    title="Revenir au GPS réel"
                    onPress={() => {
                      simulation.controller.disable();
                      close();
                      onReturnGPS();
                    }}
                  />
                  <Text style={s.caption}>
                    Les routes sont calculées réellement depuis le point simulé
                    par Valhalla. Aucun enregistrement George n’est inventé :
                    seuls les audios approuvés disponibles peuvent être
                    prévisualisés.
                  </Text>
                </>
              )}
              <Button title="Fermer" secondary onPress={close} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

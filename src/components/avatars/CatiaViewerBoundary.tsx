import React from "react";
import { Text, View } from "react-native";
import { Button, s } from "../ui";
export class CatiaViewerBoundary extends React.Component<
  { children: React.ReactNode; onImages: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn("[Catia 3D]", error.message);
  }
  render() {
    if (this.state.failed)
      return (
        <View style={{ gap: 12 }}>
          <Text style={s.heading}>Aperçu 3D indisponible</Text>
          <Text style={s.body}>
            Vérifiez la version d’Expo Go et la connexion au serveur de
            développement. Les images restent consultables et la carte continue
            de fonctionner.
          </Text>
          <Button
            title="Voir les images de contrôle"
            secondary
            onPress={this.props.onImages}
          />
        </View>
      );
    return this.props.children;
  }
}

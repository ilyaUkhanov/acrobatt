import React, { useContext, useEffect, useState } from "react";
import { Text, StyleSheet, View, Image, ScrollView } from "react-native";
import Spacer from "../components/Spacer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChallengeApi from "../api/challenge.api";
import { Context as AuthContext } from '../context/AuthContext';

const Challenge = (props) => {
  const { getToken } = useContext(AuthContext);
  let [token, setToken] = useState([]);
  // let [nameCreator, setNameCreator] = useState([]);

  const readData = async () => {
    setToken(await getToken);

    var response = await ChallengeApi.getDetail(props.challenge.id);
    setNameCreator(response);
  };

  useEffect(() => {
    readData();
  }, []);
  return (
    <ScrollView>
      <TouchableHighlight underlayColor={"COLOR"} onPress={() => signin({ email, password })}>
        <Text style={{ fontSize: 20 }}>{props.challenge.name}</Text>
        <Text>{props.challenge.description}</Text>
        <Image
          style={styles.background}
          source={{
            uri: `https://acb40feee6f1.ngrok.io/api/challenges/${props.challenge.id}/background`,
            headers: { Authorization: `Bearer ${token}` },
          }}
        />
        {/* <Text>Crée par {nameCreator}</Text> */}
        <Spacer />
      </TouchableHighlight>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.34,
  shadowRadius: 6.27,
  elevation: 10,
  background: {
    width: 100,
    height: 25,
  },
});

export default Challenge;
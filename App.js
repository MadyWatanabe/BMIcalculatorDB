import React, { Component } from 'react';
import { useState, useEffect } from "react";
import { StyleSheet, Text, Platform, SafeAreaView, ScrollView, TextInput, Pressable, TouchableOpacity, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use the following code in cmd to delay the SplashScreen: npx expo install expo-splash-screen
import * as SplashScreen from 'expo-splash-screen';
// Use the following code in cmd to get access to sqlite features: npx expo install expo-sqlite
import * as SQLite from "expo-sqlite";
import Constants from "expo-constants";

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

const heightKey = '@MyApp:heightKey';
const BMIKey = '@MyApp:BMIKey';
const db = SQLite.openDatabase("bmiDB.db");
 
// executes select statement on line 23
function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, height, weight, bmi, date(entryDate) as entryDate from items order by entryDate desc;`,
       [],
        (_, { rows: { _array } }) => setItems(_array) // produces an array of values that is stored in state
      );
    },
    (error) => {console.log("error: "+ error)});
    
  }, []);


  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.history}>
    <Text style={styles.HistoryHeading}>BMI History</Text> 
      {items.map(({ id, height, weight, bmi, entryDate }) => (
          <Text key={id} style={styles.history}>{entryDate}: {bmi}(W:{weight}, H:{height})</Text>
          
      ))}
    </View>
  );
}

export default class App extends Component {
  state = {
    height: '',
    storedHeightValue: '',
    weight:'',
    storedWeightValue: '',
    BMIcalc: '',
    entries: [], // will use this to display the entries
  };

  constructor(props) {
    super(props);
  // this is where you'll create the table
    db.transaction((tx) => {
      // tx.executeSql(
      //    "drop table items;"
      // );
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, height text, weight text, bmi text, entryDate real);"
      );
    },
    (error) => {console.log("error: "+ error)});
    
  }

  onSave = async () => {
    const { storedHeightValue } = this.state;
    const { weight } = this.state;
    const { BMIcalc } = this.state;


    let BMI = (weight / (storedHeightValue * storedHeightValue) * 703); 

    db.transaction(
      (tx) => {
        tx.executeSql ("insert into items (height, weight, bmi, entryDate) values (?, ?, ?, julianday('now'))",[storedHeightValue, weight, BMI.toFixed(1)]);
        tx.executeSql ("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      
    );
    this.setState({ BMIcalc: BMI.toFixed(1) });
  }
  
// both the state variable and parameter have the same name
  onChangeHeight = (height) => {
    this.setState({ height });
    this.setState({ storedHeightValue: height });
  }

 
  onChangeWeight = ( value) => {
    this.setState({ weight: value });
    this.setState({ storedWeightValue: value });
  }

  render() {
    const { weight, storedHeightValue, entryDate, bmi, height, id, BMIcalc } = this.state;
    let category;
    if(BMIcalc){
    if(BMIcalc < 18.5){
      category = 'underweight';
    }else if(BMIcalc >= 18.5 && BMIcalc <=24.9){
      category = 'healthy';
    }else if(BMIcalc >= 25 && BMIcalc <= 29.9){
      category = 'overweight';
    }else if(BMIcalc >= 30){
      category = 'obese';
    }
    }
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            onChangeText={this.onChangeWeight}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            style={styles.input}
            onChangeText={this.onChangeHeight}
            value={storedHeightValue}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={this.onSave}>
            <Text style={styles.button}>Compute BMI</Text>
          </TouchableOpacity>
 {/* I have commented out <Items/> as it is not functioning properly. There seems to 
 be an issue with the state? Also seems unable to get the date. Will consult on 4/5/23. */}
<Text style={styles.bmi}>{BMIcalc ? 'Body Mass Index is ' + BMIcalc : '' }</Text>
<Text style={styles.bmi}>{category ? '(' + category + ')' : ''}</Text>

<ScrollView>
<Items/>
</ScrollView>

        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor:'#f4511e',
    fontWeight: 'bold',
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 10,
  },
  button: {
    backgroundColor:'#34495e',
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
  },
  input:{
    backgroundColor:'#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    fontSize: 24, 
  },
  assessment:{
    fontSize: 20,
    paddingLeft: 5,
  },
  guide:{
    fontSize: 20,
    paddingLeft: 25,
  },
  bmi: {
fontSize: 28,
textAlign: 'center',
  },
  HistoryHeading: {
    fontSize: 24,
    marginBottom: 8,
    marginLeft: 20,
  },
  history: {
    fontSize: 20,
    marginLeft: 20,
  },
});

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect } from 'react/cjs/react.development';
import axios from 'axios';
import { FileSystemUploadType } from 'expo-file-system';

const INFERENCE_ENDPOINT = "http://35.247.34.211:5000/predict"

export default function App() {
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [audioURI, setAudioURI] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  async function startRecording() {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); 
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          // sampleRate: 44100,
          sampleRate: 48000,
          // bitRate: 128000,
          bitRate: 48000,
          numberOfChannels: 1
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          // sampleRate: 44100,
          sampleRate: 48000,
          numberOfChannels: 1,
          // bitRate: 128000,
          bitRate: 48000,
          linearPCMBitDepth: 16
        }
      });
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioURI(uri);
    console.log('Recording stopped and stored at', uri);
  }

  async function playRecording() {
    console.log('Loading sound');
    const { sound } = await Audio.Sound.createAsync({ uri: audioURI });
    setSound(sound);

    console.log('Playing sound..');
    await sound.playAsync();
  }

  async function Submit() {
    setIsFetching(true);
    try {
      const info = await FileSystem.getInfoAsync(audioURI);
      console.log(`File info: ${JSON.stringify(info)}`);
      const uri = info.uri;
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      console.log(base64String);

      // const response = await FileSystem.uploadAsync(INFERENCE_ENDPOINT, uri, {
      //   uploadType: FileSystemUploadType.BINARY_CONTENT,
      // });
      // console.log(response.body);

      // const response = await FileSystem.uploadAsync(INFERENCE_ENDPOINT, uri, {
      //   uploadType: FileSystemUploadType.MULTIPART,
      //   fieldName: 'audio_file',
      //   mimeType: 'audio/wav;codecs=opus'
      // });
      // const body = JSON.parse(response.body);
      // console.log(body);
      
      console.log('data:audio/webm;codecs=opus;base64,' + base64String);
      const response = await axios.post(INFERENCE_ENDPOINT, {
        data: 'data:audio/webm;codecs=opus;base64,' + base64String
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    return sound
    ? () => {
      console.log('Unloading sound');
      sound.unloadAsync();
    } : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      <Button
        title="Play Recording"
        onPress={playRecording}
      />
      <Button 
        title='Submit'
        onPress={Submit}
      />
      {/* <StatusBar style="auto" /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

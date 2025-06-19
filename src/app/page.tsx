"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import {
  Input,
  Button,
  Box,
  VStack,
  Heading,
  HStack,
  Avatar,
  Text,
  Container,
  Spinner
} from "@chakra-ui/react";
import { parse } from 'best-effort-json-parser'
import { Block } from "@/lib/types";
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ActionInput } from "@/components/ui/action-input";

export default function Home() {

  const setTimestamp = useCallback((timestamp: string) => () => {
    if (player.current) {
      const seconds = timestamp.split(":").reduce((acc, time) => (60 * acc) + +time, 0);
      player.current.internalPlayer.seekTo(seconds);
      player.current.internalPlayer.playVideo();
    }
  }, []);
  

  const player = useRef<YouTubePlayer | null>(null);
  const [playerContainerHeight, setPlayerContainerHeight] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoId, setVideoId] = useState("");

  const [transcript, setTranscription] = useState<Block[]>([]);
  const [summary, setSummary] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [headings, setHeadings] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const analysisRef = useRef<HTMLDivElement | null>(null);
  

  useEffect(() => {
    if (analysisRef.current != null) {
      const height = analysisRef.current.getBoundingClientRect().height;
      setPlayerContainerHeight(height);
    }
  }, [analysisRef, transcript])

  const transcribe = async (url: string) => {
    setTranscription([]);
    setPeople([]);
    setHeadings([]);
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      result += decoder.decode(value);
      console.log(result)
      try {
        const transcription: Block[] = parse(result);
        setTranscription(transcription);
        setPeople([...new Set(transcription.flatMap(block => block.body.map(item => item.name)))]);
        setHeadings([...new Set(transcription.map(block => block.heading))]);
      } catch (error) {}
    }
  };

  const summarize = async (url: string) => {
    setSummary("");
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      result += decoder.decode(value);
      setSummary(result);
    }
  };

  const analyze = async (url: string) => {
    setLoading(true);
    try {
      await Promise.all([transcribe(url), summarize(url)]);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HStack height="100vh" position={"relative"} dir="rtl" alignItems={"flex-start"}>
      <Box height={`${playerContainerHeight}px`} flexGrow={1} position={"sticky"} top={0} right={0} zIndex={1}>
        <VStack gap={4} p={8} top={0} position={"sticky"} >
          <Suspense>
            <ActionInput loading={videoLoading || loading} onAction={analyze} onVideoIdChange={videoId => setVideoId(videoId)}></ActionInput>
          </Suspense>
          <Box position="relative" w="100%" h="300px">
            { videoId && <YouTube
              ref={player}
              videoId={videoId}
              onReady={() => setVideoLoading(false)}
              opts={{ width: "100%", height: "300" }}
            /> }
            {videoLoading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                bg="blackAlpha.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={10}
              >
                <Spinner />
              </Box>
            )}
          </Box>
          {headings.length > 0 && (
            <Box as="ul" mt={4} fontSize={"sm"} fontWeight="medium" lineHeight="1.5em" w="40vw" listStyleType="circle" listStylePosition={"inside"}>
              <Heading as="h1" mb={2}>العناوينــ :</Heading>
              {headings.map((heading) => (
                <li key={heading}>{heading}</li>
              ))}
            </Box>
          )}
          {summary.length !== 0 && (
            <Box mt={4} fontSize={"sm"} fontWeight="medium" lineHeight="1.5em" w="40vw">
              <Heading as="h1" mb={2}>الملخصــ :</Heading>
              <Text textAlign={"justify"}>{summary}</Text>
            </Box>
          )}
          {people.length > 0 && (
            <Box mt={4} fontSize={"sm"} fontWeight="medium" lineHeight="1.5em" w="40vw">
              <Heading as="h1" mb={2}>الأشخاصـ :</Heading>
              <HStack alignItems="start" gap={4}>
                {people.map((person) => (
                  <HStack mb="2" key={person}>
                    <Avatar.Root>
                      <Avatar.Fallback />
                    </Avatar.Root>
                    <b>{person}</b>
                  </HStack>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>
      <VStack ref={analysisRef} gap={4} p={8} w="55vw">
          {transcript.map((block: Block) => (
            <Container key={block.timestamp} w="full" mt={4}>
              <Heading as="h2" size="lg" mt={4} textAlign="start" cursor="pointer" w="full" onClick={setTimestamp(block.timestamp)}>
                <Text textDecoration="underline">{block.heading}</Text>
                <Text fontSize="sm" color="gray.500" fontWeight="medium" lineHeight="1.5em" mt={2}>{block.timestamp}</Text>
              </Heading>
              {block.body && block.body.map((item) => (
                <Box
                  p={6}
                  bg="gray.800"
                  borderRadius="md"
                  boxShadow="md"
                  overflowY="auto"
                  dir="rtl"
                  w="full"
                  key={`${block.timestamp}-${item.name}`}
                  mt={4}
                >
                  <HStack>
                    <Avatar.Root>
                      <Avatar.Fallback />
                    </Avatar.Root>
                    <b>{item.name}</b>
                  </HStack>
                  { item.text &&
                    <Box as="p">
                      {item.text.split("\n").map((line, index) => <Text key={index} textAlign={"justify"} mt="2.5">{line}</Text>)}
                    </Box>
                  }
                  <Box mt={4} fontSize={"sm"} color="gray.500" fontWeight="medium" lineHeight="1.5em">
                    { item.text && <Text>عدد الكلمات : {item.text.split(" ").length}</Text> }
                  </Box>
                </Box>
              ))}
            </Container>
          ))}
      </VStack>
    </HStack>
  );
}

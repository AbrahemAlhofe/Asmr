"use client";

import { useEffect, useRef, useState } from "react";
import {
  Input,
  Button,
  Box,
  VStack,
  Heading,
  HStack,
  Avatar,
  Text,
  Container
} from "@chakra-ui/react";
import { Block, SummarizeResponse, TranscribeResponse } from "@/lib/types";
import YouTube, { YouTubePlayer } from 'react-youtube';

export default function Home() {
  
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const player = useRef<YouTubePlayer | null>(null);
  const [playerContainerHeight, setPlayerContainerHeight] = useState(0);

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

  useEffect(() => {
    if ( url.length != 0 ) setVideoId(url.split("v=")[1]);
  }, [url])

  const setTimestamp = (timestamp: string) => () => {
    if (player.current) {
      const seconds = timestamp.split(":").reduce((acc, time) => (60 * acc) + +time, 0);
      player.current.internalPlayer.seekTo(seconds);
      player.current.internalPlayer.playVideo();
    }
  }

  const transcribe = async () => {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const { transcription }: TranscribeResponse = await response.json();
    setTranscription(transcription);
    setPeople([...new Set(transcription.flatMap(block => block.body.map(item => item.name)))]);
    setHeadings([...new Set(transcription.map(block => block.heading))]);
  };

  const summarize = async () => {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const { summary }: SummarizeResponse = await response.json();
    setSummary(summary);
  };

  const analyze = async () => {
    setLoading(true);
    try {
      await Promise.all([transcribe(), summarize()]);
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
          <HStack w="full">
            <Button
              colorScheme="teal"
              onClick={analyze}
              loading={loading}
              p={4}
            >
              حلل الحلقة
            </Button>
            <Input
              placeholder="( e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ )"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              p={5}
              variant="subtle"
              dir="ltr"
            />
          </HStack>
          {videoId.length !== 0 && (
            <YouTube ref={player} videoId={videoId} />
          )}
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
              <Text color="gray.500">عدد الكلمات : {summary.split(" ").length}</Text>
              <Text textAlign={"justify"}>{summary}</Text>
            </Box>
          )}
          {people.length > 0 && (
            <Box mt={4} fontSize={"sm"} fontWeight="medium" lineHeight="1.5em" w="40vw">
              <Heading as="h1" mb={2}>الأشخاصـ :</Heading>
              <HStack alignItems="start" gap={4}>
                {people.map((person) => (
                  <HStack mb="2">
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
              {block.body.map((item) => (
                <Box
                  p={6}
                  bg="gray.800"
                  borderRadius="md"
                  boxShadow="md"
                  maxHeight="70vh"
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
                  <Box as="p" textAlign="justify">{item.text}</Box>
                  <Box mt={4} fontSize={"sm"} color="gray.500" fontWeight="medium" lineHeight="1.5em">
                    <Text>عدد الكلمات : {item.text.split(" ").length}</Text>
                  </Box>
                </Box>
              ))}
            </Container>
          ))}
      </VStack>
    </HStack>
  );
}

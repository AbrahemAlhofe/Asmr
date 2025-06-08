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
import { Block, TranscribeResponse } from "@/lib/types";
import YouTube, { YouTubePlayer } from 'react-youtube';

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const player = useRef<YouTubePlayer | null>(null);
  const [transcript, setTranscription] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerContainerHeight, setPlayerContainerHeight] = useState(0);
  const analysisRef = useRef<HTMLDivElement | null>(null);
  const [totalCost, setTotalCost] = useState(0);

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

  const getTranscript = async () => {
    setLoading(true); // Start loading
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const { transcription, cost }: TranscribeResponse = await response.json();
      setTranscription(transcription);
      setTotalCost(+cost.toFixed(2));
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <HStack height="100vh" position={"relative"} dir="rtl" alignItems={"flex-start"}>
      <Box height={`${playerContainerHeight}px`} flexGrow={1} position={"sticky"} top={0} right={0} zIndex={1}>
        <VStack gap={4} p={8} top={0} position={"sticky"} >
          <HStack w="full">
            {totalCost > 0 && (
              <Text fontFamily="monospace" color="gray.400" fontWeight="bold">التكلفة التقديرية : {totalCost * 49.43} ج.م</Text>
            )}
          </HStack>
          <HStack w="full">
            <Button
              colorScheme="teal"
              onClick={getTranscript}
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
        </VStack>
      </Box>
      <VStack ref={analysisRef} gap={4} p={8} w="55vw">
          {transcript.map((block: Block) => (
            <Container key={block.timestamp} w="full">
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

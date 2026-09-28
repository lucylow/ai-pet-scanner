import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, SectionTitle } from "@/components/pet-ui";
import { SafeBackButton } from "@/components/safe-back-button";

const lessons = [
  ["Take a useful photo", "Use bright indirect light, steady your phone, and fill the frame without forcing your pet into position."],
  ["Observe the whole picture", "Note changes in appetite, behavior, movement, or comfort. The image alone cannot tell the whole story."],
  ["Know when to pause", "Stop if your pet is distressed, painful, frightened, or difficult to handle safely."],
  ["Prepare for a visit", "Save the photo, write down when you first noticed the change, and bring your questions to your veterinarian."],
];

export default function LearnScreen() {
  return <ScreenContainer className="px-5 pt-5"><ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 30 }}><SectionTitle eyebrow="Learn">Helpful observation habits</SectionTitle><Text className="text-base leading-6 text-muted">The goal is not to name a condition. It is to notice changes safely and communicate clearly.</Text>{lessons.map(([title, body], index) => <Card key={title} tone={index === 2 ? "amber" : index === 0 ? "sage" : "surface"}><View style={{ gap: 8 }}><Text className="text-lg font-bold text-foreground">{title}</Text><Text className="text-sm leading-5 text-muted">{body}</Text></View></Card>)}<SafeBackButton /></ScrollView></ScreenContainer>;
}

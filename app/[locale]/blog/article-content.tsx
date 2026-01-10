import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Blog.module.css';

type ArticleContentMap = Record<string, ReactNode>;

const teachKidsEmergencyContent = (
  <>
      <h2>Introduction</h2>
      <p>
        Imagine a real emergency at home: a parent collapses, smoke starts
        drifting from the kitchen, or a younger sibling is choking. In that
        moment, most children don’t need more information—they need a practiced,
        calm routine.
      </p>
      <p>
        That’s the problem this article solves: how to teach kids emergency
        response skills in a way that actually sticks—using interactive
        technology like apps, games, VR, and{' '}
        <Link href="/en#how-it-works">
          Bobby (our kid-friendly emergency call simulation app)
        </Link>
        .
      </p>
      <p>
        Because here’s the uncomfortable truth: even when kids know the
        emergency number, many still struggle with the real-world
        steps—unlocking a phone, dialling correctly, recalling their address,
        and speaking clearly under pressure. A Pediatrics simulation study found
        many young children had difficulty successfully calling 911 on a
        smartphone during a simulated emergency (
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/33692162/"
          target="_blank"
          rel="noreferrer"
        >
          https://pubmed.ncbi.nlm.nih.gov/33692162/
        </a>
        ).
      </p>
      <p>
        Interactive practice bridges that gap—without scaring kids or putting
        them in danger.
      </p>

      <h2>Main Content</h2>
      <h3>Why emergency response skills are different from “safety rules”</h3>
      <p>
        Traditional safety advice (“stop, drop, and roll”) is memorable, but
        emergencies are messy. The essentials are less about memorizing and more
        about decision-making under stress:
      </p>
      <ul className={styles.cartoonListAlt}>
        <li>Recognize it’s an emergency (and not “wait and see”)</li>
        <li>Get help fast (999/112/911)</li>
        <li>Communicate clearly</li>
        <li>Stay safe while waiting</li>
      </ul>
      <p>
        The good news: children can learn these skills. Studies as far back as
        the 1980s show preschoolers can be taught to distinguish emergencies
        from non-emergencies and respond appropriately with training.
      </p>

      <h3>The non-negotiables: the 5 skills every child should practice</h3>
      <ol>
        <li>
          Know the right number—and when to use it
          <ul className={styles.cartoonList}>
            <li>UK: 999 (and 112 also works)</li>
            <li>EU-wide: 112</li>
            <li>US/Canada: 911</li>
          </ul>
          <p>
            In the UK, official guidance emphasizes 999 is for life-threatening
            emergencies, and NHS 111 is for urgent medical help when it’s not
            life-threatening (or when you’re unsure).
          </p>
        </li>
        <li>
          Give “Where / What / Who”
          <p>Teach a simple pattern kids can repeat:</p>
          <ul className={styles.cartoonList}>
            <li>Where are you? (address + postcode, or landmark)</li>
            <li>What happened? (short description)</li>
            <li>Who needs help? (mum/dad/sibling; conscious/unconscious)</li>
          </ul>
          <p>
            NHS guidance on 999 calls specifically notes call handlers ask for
            location, what happened, and contact details.
          </p>
        </li>
        <li>
          Stay on the line and answer questions
          <p>
            Kids should learn not to hang up, and to follow instructions
            (speakerphone helps).
          </p>
        </li>
        <li>
          Do one safe action while waiting
          <p>Examples:</p>
          <ul className={styles.cartoonList}>
            <li>unlock the front door (only if safe)</li>
            <li>go to a pre-agreed “safe spot”</li>
            <li>get a trusted neighbour from a family help list</li>
            <li>fetch a known medication only if a parent has trained them</li>
          </ul>
        </li>
        <li>
          Know what NOT to do
          <p>
            Don’t enter danger (fire/smoke, traffic, aggressive animals)
            <br />
            Don’t “go looking” for the emergency
            <br />
            Don’t delay calling because they’re worried about “getting in
            trouble”
          </p>
        </li>
      </ol>

      <h3>Why interactive technology works so well for kids</h3>
      <p>
        Interactive learning helps because it creates low-stakes repetition.
        Kids get to practice the sequence—and that’s the part that fails in real
        situations.
      </p>
      <p>
        It’s also supported by broader evidence: a 2024 review of gamification
        in disaster education found game-based approaches commonly improve
        retention and skill development outcomes across studies.
      </p>

      <h3>Spotlight: Bobby — a kid-safe way to practice calling 999</h3>
      <p>
        Bobby is built specifically for one of the highest-impact emergency
        skills: making an emergency call calmly and clearly.
      </p>
      <p>Instead of reading about emergencies, kids can:</p>
      <ul className={styles.cartoonList}>
        <li>choose an age group and scenario (ambulance, fire, etc.)</li>
        <li>“dial” 999 on an on-screen keypad</li>
        <li>speak with a voice agent that guides them through what to say</li>
        <li>receive a completion summary and a badge (gentle gamification)</li>
      </ul>
      <p>
        This turns the most intimidating part—the call itself—into something
        familiar and rehearsed, while still being parent-supervised and
        age-appropriate.
      </p>
      <p>
        Suggested visual: Screenshot collage of Bobby’s keypad + scenario
        selection
        <br />
        Alt text: “Bobby app emergency call simulation for kids with 999 keypad
        and scenario selection”
      </p>
      <p>
        Suggested video: 20–30 second demo clip of a training scenario (muted
        captions for mobile)
      </p>
      <p>
        Internal link idea: Link the first mention of Bobby to your product page
        (e.g., “Bobby emergency call simulation app”).
      </p>

      <h3>
        7 interactive ways to teach emergency response (with practical steps)
      </h3>
      <ol>
        <li>
          Emergency call simulations (best ROI)
          <p>Even outside Bobby, roleplay is powerful.</p>
          <p>How to run a 5-minute drill:</p>
          <ol className={styles.cartoonListAlt}>
            <li>Child states the address/postcode (twice)</li>
            <li>Child says: “I need ambulance/fire/police”</li>
            <li>Child delivers “Where / What / Who”</li>
            <li>Child stays on the line and answers 2 follow-up questions</li>
          </ol>
          <p>
            British Red Cross classroom resources are designed to help
            primary-aged children practice what calling 999 is like and the
            questions asked.
          </p>
          <p>
            Pro tip (important): Include phone friction. The Pediatrics
            simulation study highlights how smartphones can be a barrier for
            young kids in emergencies. Practice unlocking the screen and finding
            the dial pad safely in a supervised way.
          </p>
        </li>
        <li>
          Interactive “choose what happens next” stories
          <p>Create branching scenarios:</p>
          <ul className={styles.cartoonListAlt}>
            <li>“You smell smoke—what do you do first?”</li>
            <li>“Someone won’t wake up—what’s your first action?”</li>
            <li>
              “Your sibling is choking—do you give water or call for help?”
            </li>
          </ul>
          <p>Suggested visual: A simple decision-tree infographic</p>
          <p>
            Alt text: “Kids emergency decision tree showing when to call
            emergency services”
          </p>
        </li>
        <li>
          Kid-friendly preparedness videos (short + repeatable)
          <p>
            The American Red Cross “Prepare with Pedro” resources use stories
            and animated videos to teach preparedness and coping skills for
            early primary ages.
          </p>
          <p>Use a “microlearning” rhythm:</p>
          <ul className={styles.cartoonList}>
            <li>60–90 seconds video</li>
            <li>2 minutes discussion (“What would you do?”)</li>
            <li>1 minute practice (“Show me how you’d call.”)</li>
          </ul>
        </li>
        <li>
          Gamified learning with badges and progress
          <p>Gamification works best when rewards reflect real skills:</p>
          <ul className={styles.cartoonListAlt}>
            <li>“Calm Caller” (stays on the line)</li>
            <li>“Location Legend” (knows address/postcode)</li>
            <li>“Safety Spotter” (doesn’t enter danger)</li>
          </ul>
          <p>
            This approach is consistent with findings that gamified disaster
            education can improve retention and engagement.
          </p>
          <p>
            Bobby already supports this pattern through badges and a completion
            recap (which you can extend with a printable sticker chart at home).
          </p>
        </li>
        <li>
          First aid apps (parent-led, kid-involved)
          <p>
            Use reputable first aid resources and turn them into “one skill per
            week.”
          </p>
          <p>For example, focus on:</p>
          <ul className={styles.cartoonListAlt}>
            <li>choking basics</li>
            <li>burns and scalds</li>
            <li>severe bleeding (get help + pressure + stay safe)</li>
          </ul>
          <p>Suggested visual: “Weekly First Aid Skill” card format</p>
          <p>
            Alt text: “Weekly first aid skill card for families teaching
            children emergency response”
          </p>
        </li>
        <li>
          VR/AR simulations for older kids (10+)
          <p>VR can help older children rehearse:</p>
          <ul className={styles.cartoonList}>
            <li>scene safety (hazards first)</li>
            <li>staying calm in realistic environments</li>
            <li>CPR rhythm and steps (paired with hands-on instruction)</li>
          </ul>
          <p>
            (Use VR as a supplement—not a replacement—for real conversations and
            supervised practice.)
          </p>
        </li>
        <li>
          Family “emergency game night”
          <p>Once a week (10–15 minutes):</p>
          <ol>
            <li>1 scenario roleplay</li>
            <li>1 address/postcode recall</li>
            <li>1 “where is the safe exit?” walk-through</li>
          </ol>
          <p>Keep it upbeat: the goal is confidence, not fear.</p>
        </li>
      </ol>

      <h3>A printable emergency call script (simple and reusable)</h3>
      <p>KIDS SCRIPT: “Where / What / Who”</p>
      <p>Where: “We are at [FULL ADDRESS]. Postcode is [____].”</p>
      <p>
        What: “My [mum/dad] is [not waking up / having trouble breathing / badly
        hurt].”
      </p>
      <p>Who: “It’s my [mum/dad]. I’m [name], I’m [age].”</p>
      <p>Now: “I’m staying on the line.”</p>
      <p>
        NHS guidance supports this structure (location, what happened, contact
        details, and staying available).
      </p>
      <p>Suggested image: Printable script card next to a “practice phone”</p>
      <p>
        Alt text: “Printable emergency call script card for kids with address
        and postcode”
      </p>

      <h3>Safety + privacy: make tech training responsible</h3>
      <p>To keep emergency training safe:</p>
      <ul className={styles.cartoonListAlt}>
        <li>Always supervise young children during practice</li>
        <li>Use simulations (like Bobby) rather than real calls</li>
        <li>Avoid ad-heavy apps aimed at kids</li>
        <li>
          Minimize personal data collection in training tools (especially voice
          features)
        </li>
      </ul>
      <p>
        Also teach a clear rule: “We practice like a game, but we only call for
        real emergencies.”
      </p>

      <h3>Key Points</h3>
      <ul className={styles.cartoonList}>
        <li>Recognize it’s an emergency (and not “wait and see”)</li>
        <li>Get help fast (999/112/911)</li>
        <li>Communicate clearly</li>
        <li>Stay safe while waiting</li>
      </ul>

      <blockquote>
        Interactive practice bridges that gap—without scaring kids or putting
        them in danger.
      </blockquote>

      <h2>Conclusion</h2>
      <p>
        When you combine interactive technology, real-world drills, and family
        conversation, kids gain the confidence to act quickly and clearly in
        emergencies. Keep layering low-stress practice—through Bobby, roleplay,
        videos, and first aid refreshers—so the sequence becomes second nature.
      </p>

      <h3>Internal links (for your Bobby site)</h3>
      <p>Use 3–6 internal links to build topical authority:</p>
      <ul className={styles.cartoonListAlt}>
        <li>
          <Link href="/how-bobby-works/">/how-bobby-works/</Link>
        </li>
        <li>
          <Link href="/999-call-script-for-kids/">
            /999-call-script-for-kids/
          </Link>
        </li>
        <li>
          <Link href="/family-emergency-plan-template/">
            /family-emergency-plan-template/
          </Link>
        </li>
        <li>
          <Link href="/kids-fire-safety-at-home/">
            /kids-fire-safety-at-home/
          </Link>
        </li>
        <li>
          <Link href="/first-aid-basics-for-children/">
            /first-aid-basics-for-children/
          </Link>
        </li>
        <li>
          <Link href="/printable-emergency-contact-card/">
            /printable-emergency-contact-card/
          </Link>
        </li>
      </ul>

      <h3>External links (reputable sources)</h3>
      <ul className={styles.cartoonList}>
        <li>
          NHS: When to call 999 + what happens on the call:{' '}
          <a
            href="https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/"
            target="_blank"
            rel="noreferrer"
          >
            https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/
          </a>
        </li>
        <li>
          GOV.UK: 999 and 112 are the UK’s national emergency numbers:{' '}
          <a
            href="https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers"
            target="_blank"
            rel="noreferrer"
          >
            https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers
          </a>
        </li>
        <li>
          London Ambulance: Calling 999 and examples of life-threatening
          emergencies:{' '}
          <a
            href="https://www.londonambulance.nhs.uk/calling-us/calling-999/"
            target="_blank"
            rel="noreferrer"
          >
            https://www.londonambulance.nhs.uk/calling-us/calling-999/
          </a>
        </li>
        <li>
          British Red Cross (schools): Teaching kids how to call 999:{' '}
          <a
            href="https://firstaidchampions.redcross.org.uk/en/primary/safety/calling-999/"
            target="_blank"
            rel="noreferrer"
          >
            https://firstaidchampions.redcross.org.uk/en/primary/safety/calling-999/
          </a>
        </li>
        <li>
          American Red Cross: Prepare with Pedro (kids preparedness
          stories/videos):{' '}
          <a
            href="https://www.redcross.org/get-help/how-to-prepare-for-emergencies/teaching-kids-about-emergency-preparedness/prepare-with-pedro.html"
            target="_blank"
            rel="noreferrer"
          >
            https://www.redcross.org/get-help/how-to-prepare-for-emergencies/teaching-kids-about-emergency-preparedness/prepare-with-pedro.html
          </a>
        </li>
        <li>
          Pediatrics study (PubMed): Children’s Ability to Call 911 in an
          Emergency:{' '}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/33692162/"
            target="_blank"
            rel="noreferrer"
          >
            https://pubmed.ncbi.nlm.nih.gov/33692162/
          </a>
        </li>
      </ul>
  </>
);

export const articleContentMap: ArticleContentMap = {
  'teaching-children-emergency-calls': teachKidsEmergencyContent,
  'teach-kids-emergency-response-interactive-technology': teachKidsEmergencyContent,
};

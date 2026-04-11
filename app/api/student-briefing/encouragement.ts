// Bible verses and short prayers curated for students (grades 6-9).
// Focused on: diligence in learning, courage, identity in Christ, perseverance through hard work.
// Rotates deterministically by day-of-year, offset from the teacher pool so they don't match.

type Entry = {
  verse?: string
  reference?: string
  prayer?: string
}

const pool: Entry[] = [
  // — Diligence & hard work —
  { verse: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', reference: 'Colossians 3:23' },
  { verse: 'Commit to the Lord whatever you do, and he will establish your plans.', reference: 'Proverbs 16:3' },
  { verse: 'The plans of the diligent lead to profit as surely as haste leads to poverty.', reference: 'Proverbs 21:5' },
  { verse: 'Do you see someone skilled in their work? They will serve before kings; they will not serve before officials of low rank.', reference: 'Proverbs 22:29' },
  { verse: 'Lazy hands make for poverty, but diligent hands bring wealth.', reference: 'Proverbs 10:4' },
  { verse: 'Whatever your hand finds to do, do it with all your might.', reference: 'Ecclesiastes 9:10' },
  { verse: 'The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.', reference: 'Proverbs 13:4' },

  // — Courage & not being afraid —
  { verse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', reference: 'Joshua 1:9' },
  { verse: 'When I am afraid, I put my trust in you.', reference: 'Psalm 56:3' },
  { verse: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged.', reference: 'Joshua 1:9' },
  { verse: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?', reference: 'Psalm 27:1' },
  { verse: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', reference: '2 Timothy 1:7' },
  { verse: 'So do not fear, for I am with you; do not be dismayed, for I am your God.', reference: 'Isaiah 41:10' },

  // — Identity & purpose —
  { verse: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.', reference: 'Ephesians 2:10' },
  { verse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', reference: 'Jeremiah 29:11' },
  { verse: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.', reference: 'Psalm 139:14' },
  { verse: 'See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!', reference: '1 John 3:1' },
  { verse: 'But you are a chosen people, a royal priesthood, a holy nation, God\'s special possession.', reference: '1 Peter 2:9' },
  { verse: 'Before I formed you in the womb I knew you, before you were born I set you apart.', reference: 'Jeremiah 1:5' },

  // — Perseverance & not giving up —
  { verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', reference: 'Galatians 6:9' },
  { verse: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13' },
  { verse: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.', reference: 'Philippians 1:6' },
  { verse: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', reference: 'Isaiah 40:31' },
  { verse: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.', reference: 'James 1:2-3' },
  { verse: 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', reference: 'Deuteronomy 31:8' },

  // — Wisdom & learning —
  { verse: 'The fear of the Lord is the beginning of knowledge, but fools despise wisdom and instruction.', reference: 'Proverbs 1:7' },
  { verse: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', reference: 'James 1:5' },
  { verse: 'For the Lord gives wisdom; from his mouth come knowledge and understanding.', reference: 'Proverbs 2:6' },
  { verse: 'The heart of the discerning acquires knowledge, for the ears of the wise seek it out.', reference: 'Proverbs 18:15' },
  { verse: 'Let the wise listen and add to their learning, and let the discerning get guidance.', reference: 'Proverbs 1:5' },
  { verse: 'Apply your heart to instruction and your ears to words of knowledge.', reference: 'Proverbs 23:12' },
  { verse: 'Get wisdom, get understanding; do not forget my words or turn away from them.', reference: 'Proverbs 4:5' },

  // — Peace & trust —
  { verse: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { verse: 'Cast all your anxiety on him because he cares for you.', reference: '1 Peter 5:7' },
  { verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6' },
  { verse: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', reference: 'John 14:27' },
  { verse: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'The Lord is my shepherd, I lack nothing.', reference: 'Psalm 23:1' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },

  // — Prayers for students —
  { prayer: 'Lord, help me focus today and give my best effort. Remind me that learning is a gift and that You are with me in every challenge.' },
  { prayer: 'Father, when this work feels hard, give me the strength to keep going. You made me to learn and grow, and I can do this with Your help.' },
  { prayer: 'God, thank You for another day to learn. Help me be patient with myself and trust that every small step forward matters.' },
  { prayer: 'Lord, help me not to compare myself to others. You made me unique, and You have a plan for my life that no one else can fill.' },
  { prayer: 'Father, give me a good attitude today even when things are difficult. Help me remember that hard work now is building something great for later.' },
  { prayer: 'God, calm my mind when I feel overwhelmed. You are bigger than any problem, any test, and any worry I carry.' },
  { prayer: 'Lord, help me be kind today — to my classmates, my teacher, and myself. Let me reflect Your love in everything I do.' },
  { prayer: 'Father, thank You for teachers who care about me. Bless Mrs. Melinda today as she helps me learn and grow.' },

  // — Verse + prayer combos —
  { verse: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13', prayer: 'God, when today\'s work feels too hard, remind me that my strength comes from You — not from myself.' },
  { verse: 'The Lord your God is with you, the Mighty Warrior who saves.', reference: 'Zephaniah 3:17', prayer: 'Lord, thank You for being with me today. Help me feel Your presence even in the ordinary moments.' },
  { verse: 'Whatever you do, work at it with all your heart.', reference: 'Colossians 3:23', prayer: 'Father, help me give my best today — not for a grade, but because everything I do can honor You.' },
  { verse: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.', reference: '2 Timothy 1:7', prayer: 'Lord, replace any fear or doubt I feel with Your courage. I can face today because You go before me.' },
  { verse: 'He has made everything beautiful in its time.', reference: 'Ecclesiastes 3:11', prayer: 'God, help me trust Your timing. Even when I don\'t see progress, You are working in me.' },
  { verse: 'Your word is a lamp for my feet, a light on my path.', reference: 'Psalm 119:105', prayer: 'Father, guide my steps today. Help me make wise choices and stay on the path You have for me.' },
]

/**
 * Returns a deterministic daily encouragement for students.
 * Offset by 37 from the teacher pool so they never overlap on the same day.
 */
export function getStudentDailyEncouragement(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  const entry = pool[(dayOfYear + 37) % pool.length]

  const parts: string[] = []
  if (entry.verse && entry.reference) {
    parts.push(`"${entry.verse}" — ${entry.reference}`)
  }
  if (entry.prayer) {
    parts.push(entry.prayer)
  }
  return parts.join('\n\n')
}

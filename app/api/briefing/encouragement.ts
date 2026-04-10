// Large pool of NIV Bible verses and short prayers for Melinda's daily encouragement.
// Rotates deterministically by day-of-year. Format varies: verse only, prayer only, or both.

type Entry = {
  verse?: string
  reference?: string
  prayer?: string
}

const pool: Entry[] = [
  // — Verses about teaching & wisdom —
  { verse: 'The heart of the discerning acquires knowledge, for the ears of the wise seek it out.', reference: 'Proverbs 18:15' },
  { verse: 'Start children off on the way they should go, and even when they are old they will not turn from it.', reference: 'Proverbs 22:6' },
  { verse: 'For the Lord gives wisdom; from his mouth come knowledge and understanding.', reference: 'Proverbs 2:6' },
  { verse: 'Instruct the wise and they will be wiser still; teach the righteous and they will add to their learning.', reference: 'Proverbs 9:9' },
  { verse: 'The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.', reference: 'Proverbs 9:10' },
  { verse: 'Let the wise listen and add to their learning, and let the discerning get guidance.', reference: 'Proverbs 1:5' },
  { verse: 'Gold there is, and rubies in abundance, but lips that speak knowledge are a rare jewel.', reference: 'Proverbs 20:15' },
  { verse: 'The tongue of the wise adorns knowledge, but the mouth of the fool gushes folly.', reference: 'Proverbs 15:2' },

  // — Verses about patience & perseverance —
  { verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', reference: 'Galatians 6:9' },
  { verse: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', reference: 'Isaiah 40:31' },
  { verse: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13' },
  { verse: 'Be joyful in hope, patient in affliction, faithful in prayer.', reference: 'Romans 12:12' },
  { verse: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.', reference: 'James 1:2-3' },
  { verse: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.', reference: 'Philippians 1:6' },
  { verse: 'Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life that the Lord has promised to those who love him.', reference: 'James 1:12' },

  // — Verses about God's faithfulness —
  { verse: 'The Lord is faithful, and he will strengthen you and protect you from the evil one.', reference: '2 Thessalonians 3:3' },
  { verse: 'Great is his faithfulness; his mercies begin afresh each morning.', reference: 'Lamentations 3:23' },
  { verse: 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', reference: 'Deuteronomy 31:8' },
  { verse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', reference: 'Jeremiah 29:11' },
  { verse: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his quietness he will calm you with his love.', reference: 'Zephaniah 3:17' },
  { verse: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { verse: 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', reference: 'Proverbs 18:10' },
  { verse: 'Cast all your anxiety on him because he cares for you.', reference: '1 Peter 5:7' },

  // — Verses about strength & courage —
  { verse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', reference: 'Joshua 1:9' },
  { verse: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.', reference: 'Psalm 28:7' },
  { verse: 'God is our refuge and strength, an ever-present help in trouble.', reference: 'Psalm 46:1' },
  { verse: 'My grace is sufficient for you, for my power is made perfect in weakness.', reference: '2 Corinthians 12:9' },
  { verse: 'The joy of the Lord is your strength.', reference: 'Nehemiah 8:10' },
  { verse: 'He gives strength to the weary and increases the power of the weak.', reference: 'Isaiah 40:29' },
  { verse: 'When I am afraid, I put my trust in you.', reference: 'Psalm 56:3' },

  // — Verses about peace & rest —
  { verse: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', reference: 'John 14:27' },
  { verse: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6' },
  { verse: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.', reference: 'Psalm 23:1-3' },
  { verse: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', reference: 'Isaiah 26:3' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },

  // — Verses about love & purpose —
  { verse: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', reference: 'Romans 8:28' },
  { verse: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.', reference: 'Ephesians 2:10' },
  { verse: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', reference: 'Colossians 3:23' },
  { verse: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', reference: 'Romans 15:13' },
  { verse: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.', reference: 'Galatians 5:22-23' },
  { verse: 'Dear children, let us not love with words or speech but with actions and in truth.', reference: '1 John 3:18' },
  { verse: 'Above all, love each other deeply, because love covers over a multitude of sins.', reference: '1 Peter 4:8' },

  // — Verses about guidance & direction —
  { verse: 'Your word is a lamp for my feet, a light on my path.', reference: 'Psalm 119:105' },
  { verse: 'The Lord makes firm the steps of the one who delights in him.', reference: 'Psalm 37:23' },
  { verse: 'Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, "This is the way; walk in it."', reference: 'Isaiah 30:21' },
  { verse: 'Commit to the Lord whatever you do, and he will establish your plans.', reference: 'Proverbs 16:3' },
  { verse: 'In their hearts humans plan their course, but the Lord establishes their steps.', reference: 'Proverbs 16:9' },
  { verse: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', reference: 'James 1:5' },

  // — Prayers only —
  { prayer: 'Lord, give Melinda patience and joy as she teaches today. Let her see the fruit of her faithfulness in her students\' lives.' },
  { prayer: 'Father, bless the work of Melinda\'s hands today. May her teaching plant seeds that grow for a lifetime.' },
  { prayer: 'God, grant Melinda wisdom for each student she guides today. Remind her that this work matters to You.' },
  { prayer: 'Lord, fill Melinda with fresh energy and purpose this morning. You have called her to this, and You will equip her for it.' },
  { prayer: 'Father, when the day feels long, remind Melinda that You are her strength. She is doing Kingdom work, one lesson at a time.' },
  { prayer: 'God, surround Melinda with Your peace today. Help her trust that You are working even in the small, unseen moments.' },
  { prayer: 'Lord, thank You for Melinda\'s heart to teach. Encourage her today with glimpses of the difference she is making.' },
  { prayer: 'Father, guard Melinda\'s heart from discouragement. Remind her that faithfulness in the little things is everything.' },

  // — Verse + prayer combos —
  { verse: 'She speaks with wisdom, and faithful instruction is on her tongue.', reference: 'Proverbs 31:26', prayer: 'Lord, let Melinda\'s words today bring both knowledge and encouragement to her students.' },
  { verse: 'The Lord will guide you always; he will satisfy your needs in a sun-scorched land and will strengthen your frame.', reference: 'Isaiah 58:11', prayer: 'Father, guide every lesson and every conversation Melinda has today.' },
  { verse: 'Not that we are competent in ourselves to claim anything for ourselves, but our competence comes from God.', reference: '2 Corinthians 3:5', prayer: 'God, remind Melinda that her ability to teach comes from You — she doesn\'t have to carry it alone.' },
  { verse: 'Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.', reference: '1 Corinthians 15:58', prayer: 'Melinda, your work is not in vain. Keep going — He sees every effort.' },
  { verse: 'He has made everything beautiful in its time.', reference: 'Ecclesiastes 3:11', prayer: 'Lord, help Melinda trust Your timing in her students\' growth and in her own journey.' },
  { verse: 'The Lord is near to all who call on him, to all who call on him in truth.', reference: 'Psalm 145:18', prayer: 'Father, be near to Melinda today. Let her feel Your presence in the classroom.' },
  { verse: 'And let us consider how we may spur one another on toward love and good deeds.', reference: 'Hebrews 10:24', prayer: 'God, use Melinda to inspire her students — not just in math, but in character and faith.' },
  { verse: 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', reference: 'Nahum 1:7', prayer: 'Whatever today holds, Lord, be Melinda\'s refuge and peace.' },
]

/**
 * Returns a deterministic daily encouragement based on the current date.
 * The format varies — sometimes verse only, sometimes prayer only, sometimes both.
 * Cycles through the full pool (~70 entries) before repeating.
 */
export function getDailyEncouragement(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  const entry = pool[dayOfYear % pool.length]

  const parts: string[] = []
  if (entry.verse && entry.reference) {
    parts.push(`"${entry.verse}" — ${entry.reference}`)
  }
  if (entry.prayer) {
    parts.push(entry.prayer)
  }
  return parts.join('\n\n')
}

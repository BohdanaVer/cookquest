package com.cookquest.mascot.config;

import com.cookquest.mascot.entity.Mascot;
import com.cookquest.mascot.entity.MascotRarity;
import com.cookquest.mascot.entity.MascotType;
import com.cookquest.mascot.repository.MascotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MascotSeeder implements CommandLineRunner {

    private final MascotRepository mascotRepository;

    @Override
    public void run(String... args) {
        if (mascotRepository.findByType(MascotType.BASE).isEmpty()) {
            log.info("Ініціалізація базових маскотів у БД...");

            mascotRepository.saveAll(List.of(

                    Mascot.builder()
                            .name("MASCOT_BROCCOLI")
                            .description("DESC_BROCCOLI")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.COMMON)
                            .price(0)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088773/broccoli_happy_pbdrmc.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088773/broccoli_neutral_qwn35c.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088773/broccoli_sad_euegpt.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_SLIMEY")
                            .description("DESC_SLIMEY")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.COMMON)
                            .price(100)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088786/slime_happy_clr0a8.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088787/slime_neutral_cajpec.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088787/slime_sad_bnwvpv.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_CHESSY")
                            .description("DESC_CHESSY")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.RARE)
                            .price(200)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088776/cheese_happy_fqk455.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088777/cheese_neutral_urlu07.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088777/cheese_sad_donk20.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_PEPPY")
                            .description("DESC_PEPPY")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.RARE)
                            .price(300)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088783/pepper_happy_efgr7g.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088784/pepper_neutral_x7z39d.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088785/pepper_sad_wwbu4u.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_FROSTY")
                            .description("DESC_FROSTY")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.EPIC)
                            .price(500)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088778/icecream_happy_ovpotg.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088779/icecream_neutral_mph6a7.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088780/icecream_sad_klchca.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_OVEN")
                            .description("DESC_OVEN")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.EPIC)
                            .price(500)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088789/stove_happy_uehauo.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088789/stove_neutral_arnj5j.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088789/stove_sad_toisnv.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_CAULDRON")
                            .description("DESC_CAULDRON")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.EPIC)
                            .price(800)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088775/cauldron_happy_bvg79c.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088774/cauldron_neutral_sn7kkz.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088775/cauldron_sad_tmvtwr.png")
                            .build(),

                    Mascot.builder()
                            .name("MASCOT_KNIGHT")
                            .description("DESC_KNIGHT")
                            .type(MascotType.BASE)
                            .rarity(MascotRarity.LEGENDARY)
                            .price(1500)
                            .creatorId(null)
                            .imageUrlHappy("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088781/knightpan_happy_oyybgo.png")
                            .imageUrlNeutral("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088781/knightpan_neutral_uxuyuf.png")
                            .imageUrlSad("https://res.cloudinary.com/dhw5at0ia/image/upload/v1778088782/knightpan_sad_rwscca.png")
                            .build()
            ));
        }
    }
}